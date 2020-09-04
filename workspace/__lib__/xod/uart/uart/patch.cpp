node {
    meta {
        using Type = Uart*;
    }

    uint8_t mem[sizeof(HardwareUart)];
    HardwareUart* uart;

    void evaluate(Context ctx) {
        if (isSettingUp()) {
            auto baud = (uint32_t)getValue<input_BAUD>(ctx);
    #ifdef SERIAL_PORT_HARDWARE_OPEN
            auto serial = SERIAL_PORT_HARDWARE_OPEN;
    #else
            auto serial = SERIAL_PORT_HARDWARE;
    #endif
            uart = new (mem) HardwareUart(serial, baud);
            emitValue<output_UART>(ctx, uart);
        }

        if (isInputDirty<input_INIT>(ctx)) {
            uart->begin();
            emitValue<output_DONE>(ctx, 1);
        }
    }
}
