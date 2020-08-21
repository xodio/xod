#pragma XOD error_raise enable
#pragma XOD error_catch enable

node {
    void evaluate(Context ctx) {
        auto defDirty = isInputDirty<input_DEF>(ctx);
        auto defError = getError<input_DEF>(ctx);

        if (defDirty && defError) {
            // "DEF" input should not contain an error — reraise it
            raiseError<output_OUT>(ctx);
            return;
        }

        if (!isInputDirty<input_IN>(ctx))
            return;

        if (!getError<input_IN>(ctx))
            emitValue<output_OUT>(ctx, 1);

        if (defDirty)
            emitValue<output_OUT>(ctx, 1);
    }
}
