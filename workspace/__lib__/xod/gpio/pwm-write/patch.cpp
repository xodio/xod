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

    auto duty = getValue<input_DUTY>(ctx);
    duty = duty > 1 ? 1 : (duty < 0 ? 0 : duty);
    uint8_t val = (uint8_t)(duty * 255.0);

    ::pinMode(port, OUTPUT);
    ::analogWrite(port, val);
    emitValue<output_DONE>(ctx, 1);
}
