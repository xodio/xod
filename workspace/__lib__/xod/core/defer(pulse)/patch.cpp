#pragma XOD error_catch enable
#pragma XOD error_raise enable

node {
    bool shouldRaiseAtTheNextDeferOnlyRun = false;
    bool shouldPulseAtTheNextDeferOnlyRun = false;

    void evaluate(Context ctx) {
        if (isEarlyDeferPass()) {
            if (shouldRaiseAtTheNextDeferOnlyRun) {
                raiseError<output_OUT>(ctx);
                shouldRaiseAtTheNextDeferOnlyRun = false;
            }

            if (shouldPulseAtTheNextDeferOnlyRun) {
                emitValue<output_OUT>(ctx, true);
                shouldPulseAtTheNextDeferOnlyRun = false;
            }
        } else {
            if (getError<input_IN>(ctx)) {
                shouldRaiseAtTheNextDeferOnlyRun = true;
            } else if (isInputDirty<input_IN>(ctx)) {
                shouldPulseAtTheNextDeferOnlyRun = true;
            }

            setImmediate();
        }
    }
};
