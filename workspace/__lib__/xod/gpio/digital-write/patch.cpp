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

    ::pinMode(port, OUTPUT);
    const bool val = getValue<input_SIG>(ctx);
    ::digitalWrite(port, val);
    emitValue<output_DONE>(ctx, 1);
}
