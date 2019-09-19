
struct State {
    uint8_t port = 0;
};

using Type = State*;

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto dev = getState(ctx);
    dev->port = getValue<input_PORT>(ctx);
    emitValue<output_DEV>(ctx, dev);
}
