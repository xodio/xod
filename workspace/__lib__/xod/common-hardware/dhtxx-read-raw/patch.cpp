
struct State {
    bool reading;
};

{{ GENERATED_CODE }}

enum DhtStatus
{
    DHT_OK = 0,
    DHT_START_FAILED_1 = 1,
    DHT_START_FAILED_2 = 2,
    DHT_READ_TIMEOUT = 3,
    DHT_CHECKSUM_FAILURE = 4,
};

bool readByte(uint8_t port, uint8_t* out) {
    // Restrict waiting to prevent hanging
    unsigned long numloops = 0;
    unsigned long maxloops = microsecondsToClockCycles(100) / 16;

    // Collect 8 bits from datastream, return them interpreted
    // as a byte. I.e. if 0000.0101 is sent, return decimal 5.

    uint8_t result = 0;
    for (uint8_t i = 8; i--; ) {
        // We enter this during the first start bit (low for 50uS) of the byte
        // Wait until pin goes high
        numloops = 0;
        while (digitalRead(port) == LOW)
            if (++numloops == maxloops)
                return false;

        // Dataline will now stay high for 27 or 70 uS, depending on
        // whether a 0 or a 1 is being sent, respectively. Take to
        // a middle of that period to read the value
        delayMicroseconds(45);

        if (digitalRead(port) == HIGH)
            result |= 1 << i; // set subsequent bit

        // Wait until pin goes low again, which signals the START
        // of the NEXT bit's transmission.
        numloops = 0;
        while (digitalRead(port) == HIGH)
            if (++numloops == maxloops)
                return false;
    }

    *out = result;
    return true;
}

DhtStatus readValues(uint8_t port, uint8_t* outData) {
    bool res;

    // Stop reading request
    digitalWrite(port, HIGH);

    // DHT datasheet says host should keep line high 20-40us, then watch for
    // sensor taking line low.  That low should last 80us. Acknowledges "start
    // read and report" command.
    delayMicroseconds(40);

    // Change Arduino pin to an input, to watch for the 80us low explained a
    // moment ago.
    pinMode(port, INPUT);
    delayMicroseconds(40);

    res = digitalRead(port);

    if (res)
        return DHT_START_FAILED_1;

    delayMicroseconds(80);
    res = digitalRead(port);

    if (!res)
        return DHT_START_FAILED_2;

    // After 80us low, the line should be taken high for 80us by the sensor.
    // The low following that high is the start of the first bit of the forty
    // to come. The method readByte() expects to be called with the system
    // already into this low.
    delayMicroseconds(80);

    // now ready for data reception... pick up the 5 bytes coming from
    // the sensor
    for (uint8_t i = 0; i < 5; i++)
        if (!readByte(port, outData + i))
            return DHT_READ_TIMEOUT;

    // Restore pin to output duties
    pinMode(port, OUTPUT);
    digitalWrite(port, HIGH);

    // See if data received consistent with checksum received
    uint8_t checkSum = outData[0] + outData[1] + outData[2] + outData[3];
    if (outData[4] != checkSum)
        return DHT_CHECKSUM_FAILURE;

    return DHT_OK;
}

void enterIdleState(uint8_t port) {
    // Restore pin to output duties
    pinMode(port, OUTPUT);
    digitalWrite(port, HIGH);
}

void evaluate(Context ctx) {
    State* state = getState(ctx);
    uint8_t port = (uint8_t)getValue<input_PORT>(ctx);

    if (state->reading) {
        uint8_t data[5];
        auto status = readValues(port, data);
        if (status == DHT_OK) {
            emitValue<output_D0>(ctx, data[0]);
            emitValue<output_D1>(ctx, data[1]);
            emitValue<output_D2>(ctx, data[2]);
            emitValue<output_D3>(ctx, data[3]);
            emitValue<output_DONE>(ctx, 1);
        } else {
            emitValue<output_ERR>(ctx, 1);
        }

        enterIdleState(port);
        state->reading = false;
    } else if (isInputDirty<input_UPD>(ctx)) {
        // initiate request for data
        pinMode(port, OUTPUT);
        digitalWrite(port, LOW);
        // for request we should keep the line low for 18+ ms
        setTimeout(ctx, 18);
        state->reading = true;
    } else {
        enterIdleState(port);
    }
}
