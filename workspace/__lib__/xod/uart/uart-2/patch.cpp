struct State {
    uint8_t mem[sizeof(HardwareUart)];
    HardwareUart* uart;
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    auto state = getState(ctx);

    if (isSettingUp()) {
        state->uart = new (state->mem) HardwareUart(Serial2, (uint32_t)getValue<input_BAUD>(ctx));
        emitValue<output_UART>(ctx, state->uart);
    }

    if (isInputDirty<input_INIT>(ctx)) {
        state->uart->begin();
        emitValue<output_DONE>(ctx, 1);
    }
}
