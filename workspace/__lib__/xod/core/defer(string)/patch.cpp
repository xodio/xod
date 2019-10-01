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
        } else {
            // This will not have any immediate effect, because
            // deferred nodes are at the very bottom of sorted graph.
            // We do this to just save the value for reemission
            // on deferred-only evaluation.
            emitValue<output_OUT>(ctx, getValue<input_IN>(ctx));
        }

        setTimeout(ctx, 0);
    } else { // This means that we are at the defer-only stage
        if (isSettingUp()) return;

        if (state->shouldRaiseAtTheNextDeferOnlyRun) {
            raiseError<output_OUT>(ctx);
            state->shouldRaiseAtTheNextDeferOnlyRun = false;
        } else {
            emitValue<output_OUT>(ctx, getValue<output_OUT>(ctx));
        }
    }
}
