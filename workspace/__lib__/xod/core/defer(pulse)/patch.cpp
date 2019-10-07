#pragma XOD error_catch enable
#pragma XOD error_raise enable

struct State {
    bool shouldRaiseAtTheNextDeferOnlyRun = false;
    bool shouldPulseAtTheNextDeferOnlyRun = false;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto state = getState(ctx);

    if (isEarlyDeferPass()) {
        if (state->shouldRaiseAtTheNextDeferOnlyRun) {
            raiseError<output_OUT>(ctx);
            state->shouldRaiseAtTheNextDeferOnlyRun = false;
        }

        if (state->shouldPulseAtTheNextDeferOnlyRun) {
            emitValue<output_OUT>(ctx, true);
            state->shouldPulseAtTheNextDeferOnlyRun = false;
        }
    } else {
        if (getError<input_IN>(ctx)) {
            state->shouldRaiseAtTheNextDeferOnlyRun = true;
        } else if (isInputDirty<input_IN>(ctx)) {
            state->shouldPulseAtTheNextDeferOnlyRun = true;
        }

        setTimeout(ctx, 0);
    }
}
