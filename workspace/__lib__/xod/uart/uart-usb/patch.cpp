class UsbUart : public Uart {
private:
    Serial_ _serial;
    uint8_t _rx;
    uint8_t _tx;

public:
    UsbUart(Serial_ serial, long baud = 9600) : Uart(baud) {
        _serial = serial;
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

    Serial_* toUsbSerial() {
        return &_serial;
    }
};

void UsbUart::begin() {
    _started = true;
    _serial.begin(getBaudRate());
};
void UsbUart::end() {
    _started = false;
    _serial.end();
};
void UsbUart::flush() {
    _serial.flush();
}

template<typename T>
struct ChooseUartWrapper {
  using UartT = HardwareUart;
};
template<>
struct ChooseUartWrapper<Serial_> {
  using UartT = UsbUart;
};

struct State {
    uint8_t mem[sizeof(ChooseUartWrapper<typeof SerialUSB>::UartT)];
    ChooseUartWrapper<typeof SerialUSB>::UartT* uart;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto state = getState(ctx);
    state->uart = new (state->mem) ChooseUartWrapper<typeof SerialUSB>::UartT(SerialUSB, (uint32_t)getValue<input_BAUD>(ctx));
    emitValue<output_UART>(ctx, state->uart);
}
