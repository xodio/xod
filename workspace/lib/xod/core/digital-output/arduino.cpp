struct State {
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid, State* state) {
    const int pin = (int)getNumber(nid, Inputs::PIN);
    const bool val = getLogic(nid, Inputs::VALUE);

    if (isInputDirty(nid, Inputs::PIN)) {
        ::pinMode(pin, OUTPUT);
    }

    ::digitalWrite(pin, val);
}
