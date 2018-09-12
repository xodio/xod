// clang-format off
{{#global}}
#include <SoftwareSerial.h>
{{/global}}
// clang-format on

class SoftwareUart : public Uart {
private:
    SoftwareSerial _serial;
    uint8_t _rx;
    uint8_t _tx;

public:
    SoftwareUart(uint8_t rx, uint8_t tx, long baud = 9600)
        : Uart(baud)
        , _serial(rx, tx) {
        _rx = rx;
        _tx = tx;
    }

    void begin();
    void end();
    void flush();

    bool available() {
        return (bool)_serial.available();
    }

    bool writeByte(uint8_t byte) {
        return (bool)_serial.write(byte);
    }

    bool readByte(uint8_t* out) {
        int data = _serial.read();
        if (data == -1)
            return false;
        *out = data;
        return true;
    }

    uint8_t getRX() {
        return _rx;
    }

    uint8_t getTX() {
        return _tx;
    }

    SoftwareSerial* toSoftwareSerial() {
        return &_serial;
    }
};

void SoftwareUart::begin() {
    _started = true;
    _serial.begin(getBaudRate());
};
void SoftwareUart::end() {
    _started = false;
    _serial.end();
};
void SoftwareUart::flush() {
    _serial.flush();
}

struct State {
    uint8_t mem[sizeof(SoftwareUart)];
    SoftwareUart* uart;
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    auto state = getState(ctx);

    if (isSettingUp()) {
        uint8_t rx = getValue<input_RX>(ctx);
        uint8_t tx = getValue<input_TX>(ctx);
        long baud = (long)getValue<input_BAUD>(ctx);
        state->uart = new (state->mem) SoftwareUart(rx, tx, baud);
        emitValue<output_UART>(ctx, state->uart);
    }

    if (isInputDirty<input_INIT>(ctx)) {
        state->uart->begin();
        emitValue<output_DONE>(ctx, 1);
    }
}
