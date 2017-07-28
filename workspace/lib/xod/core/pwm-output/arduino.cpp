struct State {
    int configuredPort = -1;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    State* state = getState(ctx);
    const int port = (int)getValue<input_PORT>(ctx);
    if (port != state->configuredPort) {
        ::pinMode(port, OUTPUT);
        // Store configured port so to avoid repeating `pinMode` call if just
        // SIG is updated
        state->configuredPort = port;
    }

    auto duty = getValue<input_DUTY>(ctx);
    duty = duty > 1 ? 1 : (duty < 0 ? 0 : duty);

    uint8_t val = (uint8_t)(duty * 255.0);
    ::analogWrite(port, val);
}
