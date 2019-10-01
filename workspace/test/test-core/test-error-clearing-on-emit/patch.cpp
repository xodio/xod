
struct State {};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (isInputDirty<input_RAISE>(ctx)) {
        raiseError(ctx);
    } else if (isInputDirty<input_EMIT>(ctx)) {
        emitValue<output_OUT>(ctx, 42);
    }
}
