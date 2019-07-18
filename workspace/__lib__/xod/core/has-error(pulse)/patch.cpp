
#pragma XOD error_catch enable

struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (isInputDirty<input_IN>(ctx) && getError<input_IN>(ctx)) {
        emitValue<output_OUT>(ctx, true);
        // Manually trigger a reevaluation by setting timeout.
        // The reevaluation is needed to set the output to False
        // even when no pulse is received.
        setTimeout(ctx, 0);
        return;
    }

    if (isTimedOut(ctx)) {
        emitValue<output_OUT>(ctx, false);
    }
}
