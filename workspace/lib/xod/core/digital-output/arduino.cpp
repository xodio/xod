struct State {
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid, State* state) {
    const int pin = (int)getNumber(nid, Inputs::PORT);
    const bool val = getLogic(nid, Inputs::SIG);

    if (isInputDirty(nid, Inputs::PORT)) {
        ::pinMode(pin, OUTPUT);
    }

    ::digitalWrite(pin, val);
}
