node {
    uint8_t mem[sizeof(HardwareUart)];
    HardwareUart* uart;

    void evaluate(Context ctx) {
        if (isSettingUp()) {
            uart = new (mem) HardwareUart(Serial, (uint32_t)getValue<input_BAUD>(ctx));
            emitValue<output_UART>(ctx, uart);
        }

        if (isInputDirty<input_INIT>(ctx)) {
            uart->begin();
            emitValue<output_DONE>(ctx, 1);
        }
    }
}
