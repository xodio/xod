#pragma XOD error_catch enable
#pragma XOD error_raise enable

struct State {
    bool shouldRaiseAtTheNextDeferOnlyRun = false;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto state = getState(ctx);

    if (isEarlyDeferPass()) {
        if (state->shouldRaiseAtTheNextDeferOnlyRun) {
            raiseError<output_OUT>(ctx);
            state->shouldRaiseAtTheNextDeferOnlyRun = false;
        } else {
            emitValue<output_OUT>(ctx, getValue<output_OUT>(ctx));
        }
    } else {
        if (getError<input_IN>(ctx)) {
            state->shouldRaiseAtTheNextDeferOnlyRun = true;
        } else {
            // save the value for reemission on deferred-only evaluation pass
            emitValue<output_OUT>(ctx, getValue<input_IN>(ctx));
        }

        setTimeout(ctx, 0);
    }
}
