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
    } else { // This means that we are at the defer-only stage
        if (isSettingUp()) return;
        
        if (state->shouldRaiseAtTheNextDeferOnlyRun) {
            raiseError<output_OUT>(ctx);
            state->shouldRaiseAtTheNextDeferOnlyRun = false;
        }

        emitValue<output_OUT>(ctx, true);
    }
}
