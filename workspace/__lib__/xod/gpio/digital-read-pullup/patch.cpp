#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_UPD
#pragma XOD error_raise enable

struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (!isInputDirty<input_UPD>(ctx))
        return;

    const uint8_t port = getValue<input_PORT>(ctx);
    if (!isValidDigitalPort(port)) {
        raiseError(ctx);
        return;
    }

    ::pinMode(port, INPUT_PULLUP);
    emitValue<output_SIG>(ctx, ::digitalRead(port));
    emitValue<output_DONE>(ctx, 1);
}
