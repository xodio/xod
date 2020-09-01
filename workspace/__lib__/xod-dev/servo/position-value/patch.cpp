#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_UPD

node {
    void evaluate(Context ctx) {
        auto xservo = getValue<input_DEV>(ctx);

        if (isSettingUp()) {
            // Short-circuit DEV and DEV'
            emitValue<output_DEVU0027>(ctx, xservo);
        }

        if (!isInputDirty<input_UPD>(ctx))
            return;

        emitValue<output_VAL>(ctx, xservo->read01());
        emitValue<output_DONE>(ctx, 1);
    }
}
