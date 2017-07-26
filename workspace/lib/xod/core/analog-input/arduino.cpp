struct State {
    int configuredPort = -1;
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid) {
    if (!isInputDirty<input_UPD>(nid))
        return;

    State* state = getState(nid);
    const int port = (int)getValue<input_PORT>(nid);
    if (port != state->configuredPort) {
        ::pinMode(port, INPUT);
        // Store configured port so to avoid repeating `pinMode` on
        // subsequent requests
        state->configuredPort = port;
    }

    emitValue<output_VAL>(nid, ::analogRead(port) / 1023.);
}
