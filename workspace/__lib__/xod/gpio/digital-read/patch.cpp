struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (!isInputDirty<input_UPD>(ctx))
        return;

    const uint8_t port = getValue<input_PORT>(ctx);
    bool err = (port < 0 || port > NUM_DIGITAL_PINS - 1);
    if (err) {
        emitValue<output_ERR>(ctx, 1);
        return;
    }

    ::pinMode(port, INPUT);
    emitValue<output_SIG>(ctx, ::digitalRead(port));
    emitValue<output_DONE>(ctx, 1);
}
