struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (!isInputDirty<input_UPD>(ctx))
        return;

    const uint8_t port = getValue<input_PORT>(ctx);
    bool err = (port < A0 || port > A0 + NUM_ANALOG_INPUTS - 1);
    if (err) {
        emitValue<output_ERR>(ctx, 1);
        return;
    }

    ::pinMode(port, INPUT);
    emitValue<output_VAL>(ctx, ::analogRead(port) / 1023.);
    emitValue<output_DONE>(ctx, 1);
}
