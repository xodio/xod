
struct State {};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (getValue<input_ERR>(ctx)) {
        raiseError(ctx);
    } else {
        emitValue<output_OUT1>(ctx, 1.0);
        emitValue<output_OUT2>(ctx, 2.0);
    }
}
