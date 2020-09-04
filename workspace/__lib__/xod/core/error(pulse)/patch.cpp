#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_IN
#pragma XOD error_raise enable

node {
    void evaluate(Context ctx) {
        if (!isInputDirty<input_IN>(ctx))
            return;

        if (getValue<input_ERR>(ctx))
            raiseError<output_OUT>(ctx);
        else
            emitValue<output_OUT>(ctx, 1);
    }
}
