struct State {
    int configuredPort = -1;
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid, State* state) {
    if (!isInputDirty<Inputs::UPD>(nid))
        return;

    const int port = (int)getValue<Inputs::PORT>(nid);
    if (port != state->configuredPort) {
        ::pinMode(port, INPUT);
        // Store configured port so to avoid repeating `pinMode` on
        // subsequent requests
        state->configuredPort = port;
    }

    emitValue<Outputs::VAL>(nid, ::analogRead(port) / 1023.);
    emitValue<Outputs::RDY>(nid, 1);
}
