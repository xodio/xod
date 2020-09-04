
#pragma XOD error_catch enable

node {
    void evaluate(Context ctx) {
        if (getError<input_IN>(ctx)) {
            emitValue<output_OUT>(ctx, true);
        } else {
            emitValue<output_OUT>(ctx, false);
        }
    }
}
