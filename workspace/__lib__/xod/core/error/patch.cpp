#pragma XOD error_raise enable

struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (getValue<input_ERR>(ctx)) {
        raiseError<output_OUT>(ctx);
    } else {
        emitValue<output_OUT>(ctx, getValue<input_IN>(ctx));
    }
}
