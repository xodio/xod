#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_UPD

struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    static_assert(isValidDigitalPort(constant_input_PORT), "must be a valid digital port");

    if (!isInputDirty<input_UPD>(ctx))
        return;

    ::pinMode(constant_input_PORT, INPUT_PULLUP);
    emitValue<output_SIG>(ctx, ::digitalRead(constant_input_PORT));
    emitValue<output_DONE>(ctx, 1);
}
