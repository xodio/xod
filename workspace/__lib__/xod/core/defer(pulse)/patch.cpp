#pragma XOD error_catch enable
#pragma XOD error_raise enable

struct State {
    bool shouldRaiseAtTheNextDeferOnlyRun = false;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto state = getState(ctx);

    if (isInputDirty<input_IN>(ctx)) { // This happens only when all nodes are evaluated
        if (getError<input_IN>(ctx)) {
            state->shouldRaiseAtTheNextDeferOnlyRun = true;
        }

        setTimeout(ctx, 0);
    } else if (isTimedOut(ctx)) { // This means that we are at the defer-only stage
        if (isSettingUp()) return;

        if (state->shouldRaiseAtTheNextDeferOnlyRun) {
            raiseError<output_OUT>(ctx);
            state->shouldRaiseAtTheNextDeferOnlyRun = false;
        } else {
            emitValue<output_OUT>(ctx, true);
        }
    } else if (!isSettingUp()) { // This means that an upstream pulse output was cleared from error
        setTimeout(ctx, 0);
    }
}
