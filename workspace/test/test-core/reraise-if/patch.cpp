#pragma XOD error_catch enable
#pragma XOD error_raise enable

struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (getValue<input_RR>(ctx)) {
        raiseError<output_OUT>(ctx);
    } else {
        emitValue<output_OUT>(ctx, getValue<input_IN>(ctx));
    }
}
