struct State {
    uint8_t mem[sizeof(HardwareUart)];
    HardwareUart* uart;
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    auto state = getState(ctx);
    state->uart = new (state->mem) HardwareUart(Serial3, (uint32_t)getValue<input_BAUD>(ctx));
    emitValue<output_UART>(ctx, state->uart);
}
