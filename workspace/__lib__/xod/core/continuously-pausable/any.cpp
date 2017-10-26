struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (getValue<input_EN>(ctx)) {
        emitValue<output_TICK>(ctx, 1);
        setTimeout(ctx, 0);
    } else {
        clearTimeout(ctx);
    }
}
