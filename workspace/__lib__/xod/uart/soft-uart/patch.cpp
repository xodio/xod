#include <SoftwareSerial.h>

namespace xod {
namespace uart_software {
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
        *out = (uint8_t)data;
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

} // namespace uart_software
} // namespace xod

node {
    uint8_t mem[sizeof(uart_software::SoftwareUart)];
    uart_software::SoftwareUart* uart;

    void evaluate(Context ctx) {
        if (isSettingUp()) {
            uint8_t rx = getValue<input_RX>(ctx);
            uint8_t tx = getValue<input_TX>(ctx);
            long baud = (long)getValue<input_BAUD>(ctx);
            uart = new (mem) uart_software::SoftwareUart(rx, tx, baud);
            emitValue<output_UART>(ctx, uart);
        }

        if (isInputDirty<input_INIT>(ctx)) {
            uart->begin();
            emitValue<output_DONE>(ctx, 1);
        }
    }
}
