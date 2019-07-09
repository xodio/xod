#pragma XOD error_catch enable
#pragma XOD error_raise enable

struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto err = getError<input_IN>(ctx);
    if (err) {
        raiseError<output_OUT>(ctx);
        setTimeout(ctx, 0);
    } else {
        if (isInputDirty<input_IN>(ctx)) { // This happens only when all nodes are evaluated
            setTimeout(ctx, 0);
        } else {
            emitValue<output_OUT>(ctx, true);
        }
    }
}
