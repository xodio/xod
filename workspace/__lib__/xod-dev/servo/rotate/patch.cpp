#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_DO

node {
    void evaluate(Context ctx) {
        auto xservo = getValue<input_DEV>(ctx);

        if (isSettingUp()) {
            // Short-circuit DEV and DEV'
            emitValue<output_DEVU0027>(ctx, xservo);
        }

        if (!isInputDirty<input_DO>(ctx))
            return;

        auto angle = getValue<input_VAL>(ctx);
        xservo->write01(angle);
        emitValue<output_ACK>(ctx, 1);
    }
}
