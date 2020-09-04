#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_UPD

node {
    void evaluate(Context ctx) {
        static_assert(isValidDigitalPort(constant_input_PORT), "must be a valid digital port");

        if (!isInputDirty<input_UPD>(ctx))
            return;

        ::pinMode(constant_input_PORT, OUTPUT);
        const bool val = getValue<input_SIG>(ctx);
        ::digitalWrite(constant_input_PORT, val);
        emitValue<output_DONE>(ctx, 1);
    }
}
