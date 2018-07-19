using Type = Uart*;
struct State {
    uint8_t mem[sizeof(HardwareUart)];
    HardwareUart* uart;
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    auto state = getState(ctx);
    auto baud = (uint32_t)getValue<input_BAUD>(ctx);
#ifdef SERIAL_PORT_HARDWARE_OPEN
    auto serial = SERIAL_PORT_HARDWARE_OPEN;
#else
    auto serial = SERIAL_PORT_HARDWARE;
#endif
    state->uart = new (state->mem) HardwareUart(serial, baud);
    emitValue<output_UART>(ctx, state->uart);
}
