/*
 *  Datasheet can be found at
 *  https://cdn-shop.adafruit.com/datasheets/DS18B20.pdf
 *
 *  Most code comments are quotes from that datasheet
 */

enum {
    CMD_CONVERT = 0x44,
    CMD_READ_SCRATCHPAD = 0xBE,
    CMD_SKIP_ROM = 0xCC
};

void writeByte(uint8_t pin, uint8_t data) {
    pinMode(pin, OUTPUT);

    // There are two types of write time slots: “Write 1” time slots and “Write
    // 0” time slots. The bus master uses a Write 1 time slot to write a logic
    // 1 to the DS18B20 and a Write 0 time slot to write a logic 0 to the
    // DS18B20. All write time slots must be a minimum of 60µs in duration with
    // a minimum of a 1µs recovery time between individual write slots. Both
    // types of write time slots are initiated by the master pulling the 1-Wire
    // bus low

    for (uint8_t i = 8; i--; data >>= 1) {
        bool bit = data & 0x01;

        // To generate a Write 1 time slot, after pulling the 1-Wire bus low,
        // the bus master must release the 1-Wire bus within 15µs. When the bus
        // is released, the 5kΩ pullup resistor will pull the bus high. To
        // generate a Write 0 time slot, after pulling the 1-Wire bus low, the
        // bus master must continue to hold the bus low for the duration of the
        // time slot (at least 60µs)

        digitalWrite(pin, LOW);
        delayMicroseconds(bit ? 10 : 50);
        digitalWrite(pin, HIGH);
        delayMicroseconds(bit ? 50 : 10);

    }

    pinMode(pin, INPUT); // release the bus
}

uint8_t readByte(uint8_t pin) {
    uint8_t r = 0;
    for (uint8_t i = 0; i < 8; ++i) {
        // All read time slots must be a minimum of 60µs in duration with a
        // minimum of a 1µs recovery time between slots. A read time slot is
        // initiated by the master device pulling the 1-Wire bus low for a
        // minimum of 1µs and then releasing the bus.
        pinMode(pin, OUTPUT);
        digitalWrite(pin, LOW);
        delayMicroseconds(1);
        pinMode(pin, INPUT);

        // Output data from the DS18B20 is valid for 15µs after the falling
        // edge that initiated the read time slot.  Therefore, the master must
        // release the bus and then sample the bus state within 15µs from the
        // start of the slot.
        delayMicroseconds(5);

        // After the master initiates the read time slot, the DS18B20 will
        // begin transmitting a 1 or 0 on bus. The DS18B20 transmits a 1 by
        // leaving the bus high and transmits a 0 by pulling the bus low. When
        // transmitting a 0, the DS18B20 will release the bus by the end of the
        // time slot, and the bus will be pulled back to its high idle state by
        // the pullup resister.
        r |= digitalRead(pin) << i;

        delayMicroseconds(54); // complete the cycle
    }

    return r;
}

bool init(uint8_t pin) {
    // All communication with the DS18B20 begins with an initialization
    // sequence that consists of a reset pulse from the master followed by a
    // presence pulse from the DS18B20...

    // During the initialization sequence the bus master transmits (TX) the
    // reset pulse by pulling the 1-Wire bus low for a minimum of 480µs. The
    // bus master then releases the bus and goes into receive mode (RX).
    pinMode(pin, OUTPUT);
    digitalWrite(pin, LOW);
    delayMicroseconds(480);
    pinMode(pin, INPUT);

    // When the bus is released, the 5kΩ pullup resistor pulls the 1-Wire bus
    // high. When the DS18B20 detects this rising edge, it waits 15µs to 60µs
    // and then transmits a presence pulse by pulling the 1-Wire bus low for
    // 60µs to 240µs.
    delayMicroseconds(60);
    if (digitalRead(pin))
        return false; // no presence

    delayMicroseconds(420); // complete initialization procedure

    return true;
}

bool readTemperature(uint8_t pin, Number* out) {
    if (!init(pin))
        return false;

    writeByte(pin, CMD_SKIP_ROM);
    writeByte(pin, CMD_CONVERT);

    if (!init(pin))
        return false;

    writeByte(pin, CMD_SKIP_ROM);
    writeByte(pin, CMD_READ_SCRATCHPAD);

    int16_t hi = readByte(pin);
    int16_t lo = readByte(pin);
    *out = (Number)(hi | lo << 8) / 16.0;
    return true;
}

struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (!isInputDirty<input_UPD>(ctx))
        return;

    auto port = getValue<input_PORT>(ctx);
    Number tc;
    bool success = readTemperature(port, &tc);
    if (!success)
        return;

    emitValue<output_Tc>(ctx, tc);
    emitValue<output_DONE>(ctx, 1);
}
