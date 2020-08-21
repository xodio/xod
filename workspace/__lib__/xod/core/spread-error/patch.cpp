#pragma XOD error_raise enable

node {
    void evaluate(Context ctx) {
        if (getError<input_A>(ctx) || getError<input_B>(ctx)) {
            raiseError(ctx);
            return;
        }

        emitValue<output_AU0027>(ctx, getValue<input_A>(ctx));
        emitValue<output_BU0027>(ctx, getValue<input_B>(ctx));
    }
}
