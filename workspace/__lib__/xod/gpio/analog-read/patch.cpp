#pragma XOD error_raise enable

struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (!isInputDirty<input_UPD>(ctx))
        return;

    const uint8_t port = getValue<input_PORT>(ctx);

    if (!isValidAnalogPort(port)) {
        raiseError(ctx);
        return;
    }

    ::pinMode(port, INPUT);
    emitValue<output_VAL>(ctx, ::analogRead(port) / 1023.);
    emitValue<output_DONE>(ctx, 1);
}
