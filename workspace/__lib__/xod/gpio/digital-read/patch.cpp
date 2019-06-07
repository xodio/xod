#pragma XOD error_raise enable

struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (!isInputDirty<input_UPD>(ctx))
        return;

    const uint8_t port = getValue<input_PORT>(ctx);
    if (!isValidDigitalPort(port)) {
        raiseError(ctx, 255);
        return;
    }

    ::pinMode(port, INPUT);
    emitValue<output_SIG>(ctx, ::digitalRead(port));
    emitValue<output_DONE>(ctx, 1);
}
