
#pragma XOD error_catch enable

struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (getError<input_IN>(ctx)) {
        emitValue<output_OUT>(ctx, 1);
    }
}
