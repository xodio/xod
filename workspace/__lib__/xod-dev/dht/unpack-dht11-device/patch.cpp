
struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto dev = getValue<input_DEV>(ctx);
    emitValue<output_OUT>(ctx, dev->port);
}
