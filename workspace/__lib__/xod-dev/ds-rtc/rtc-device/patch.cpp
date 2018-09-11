
struct State {
};

struct Type {
    TwoWire* wire;
    uint8_t addr;
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    Type dev;
    dev.addr = getValue<input_ADDR>(ctx);
    dev.wire = getValue<input_I2C>(ctx);
    emitValue<output_DEV>(ctx, dev);
}
