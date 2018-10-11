
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

unsigned long pulseInLength(uint8_t pin, bool state, unsigned long timeout) {
    unsigned long startMicros = micros();
    while (digitalRead(pin) == state) {
        if (micros() - startMicros > timeout)
            return 0;
    }
    return micros() - startMicros;
}

bool readByte(uint8_t port, uint8_t* out) {
    // Collect 8 bits from datastream, return them interpreted
    // as a byte. I.e. if 0000.0101 is sent, return decimal 5.

    unsigned long pulseLength = 0;
    uint8_t result = 0;
    for (uint8_t i = 8; i--; ) {
        // We enter this during the first start bit (low for 50uS) of the byte

        if (pulseInLength(port, LOW, 70) == 0)
            return false;

        // Dataline will now stay high for 27 or 70 uS, depending on
        // whether a 0 or a 1 is being sent, respectively.

        pulseLength = pulseInLength(port, HIGH, 80);

        if (pulseLength == 0)
            return false;

        if (pulseLength > 45)
            result |= 1 << i; // set subsequent bit
    }

    *out = result;
    return true;
}

DhtStatus readValues(uint8_t port, uint8_t* outData) {
    // Stop reading request
    digitalWrite(port, HIGH);

    // DHT datasheet says host should keep line high 20-40us, then watch for
    // sensor taking line low.  That low should last 80us. Acknowledges "start
    // read and report" command.
    delayMicroseconds(30);

    // Change Arduino pin to an input, to watch for the 80us low explained a
    // moment ago.
    pinMode(port, INPUT_PULLUP);

    if (pulseInLength(port, LOW, 90) == 0)
        return DHT_START_FAILED_1;

    // After 80us low, the line should be taken high for 80us by the sensor.
    // The low following that high is the start of the first bit of the forty
    // to come. The method readByte() expects to be called with the system
    // already into this low.
    if (pulseInLength(port, HIGH, 90) == 0)
        return DHT_START_FAILED_2;

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
