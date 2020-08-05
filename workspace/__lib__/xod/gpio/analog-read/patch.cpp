#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_UPD

node {
    void evaluate(Context ctx) {
        static_assert(isValidAnalogPort(constant_input_PORT), "must be a valid analog port");

        if (!isInputDirty<input_UPD>(ctx))
            return;

        ::pinMode(constant_input_PORT, INPUT);
        emitValue<output_VAL>(ctx, ::analogRead(constant_input_PORT) / 1023.);
        emitValue<output_DONE>(ctx, 1);
    }
}
