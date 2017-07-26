struct State {
    int configuredPort = -1;
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid) {
    State* state = getState(nid);
    const int port = (int)getValue<input_PORT>(nid);
    if (port != state->configuredPort) {
        ::pinMode(port, OUTPUT);
        // Store configured port so to avoid repeating `pinMode` call if just
        // SIG is updated
        state->configuredPort = port;
    }

    auto duty = getValue<input_DUTY>(nid);
    duty = duty > 1 ? 1 : (duty < 0 ? 0 : duty);

    uint8_t val = (uint8_t)(duty * 255.0);
    ::analogWrite(port, val);
}
