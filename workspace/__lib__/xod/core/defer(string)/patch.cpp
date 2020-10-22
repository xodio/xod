#pragma XOD error_catch enable
#pragma XOD error_raise enable

node {
    bool shouldRaiseAtTheNextDeferOnlyRun = false;

    void evaluate(Context ctx) {
        if (isEarlyDeferPass()) {
            if (shouldRaiseAtTheNextDeferOnlyRun) {
                raiseError<output_OUT>(ctx);
                shouldRaiseAtTheNextDeferOnlyRun = false;
            } else {
                emitValue<output_OUT>(ctx, getValue<output_OUT>(ctx));
            }
        } else {
            if (getError<input_IN>(ctx)) {
                shouldRaiseAtTheNextDeferOnlyRun = true;
            } else {
                // save the value for reemission on deferred-only evaluation pass
                emitValue<output_OUT>(ctx, getValue<input_IN>(ctx));
            }

            setImmediate();
        }
    }
}
