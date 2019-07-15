
struct State {};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (getValue<input_ERR1>(ctx)) {
        raiseError<output_OUT1>(ctx);
    } else {
        emitValue<output_OUT1>(ctx, 1.0);
    }

    if (getValue<input_ERR2>(ctx)) {
        raiseError<output_OUT2>(ctx);
    } else {
        emitValue<output_OUT2>(ctx, 2.0);
    }
}
