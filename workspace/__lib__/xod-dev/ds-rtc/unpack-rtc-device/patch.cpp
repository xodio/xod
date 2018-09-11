
struct State {
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    auto dev = getValue<input_DEV>(ctx);
    emitValue<output_I2C>(ctx, dev.wire);
    emitValue<output_ADDR>(ctx, dev.addr);
}
