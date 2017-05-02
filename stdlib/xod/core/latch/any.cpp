struct State {
    bool value;
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid, State* state) {
    if (isInputDirty(nid, Inputs::RST)) {
        state->value = false;
    } else if (isInputDirty(nid, Inputs::SET)) {
        state->value = true;
    } else {
        state->value = !state->value;
    }

    emitLogic(nid, Outputs::OUT, state->value);
}
