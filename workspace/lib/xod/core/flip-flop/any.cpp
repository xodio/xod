struct State {
    bool state = false;
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid, State* state) {
    bool newState = state->state;
    if (isInputDirty<Inputs::TGL>(nid)) {
        newState = !state->state;
    } else if (isInputDirty<Inputs::SET>(nid)) {
        newState = true;
    } else {
        newState = false;
    }

    if (newState == state->state)
        return;

    state->state = newState;
    emitValue<Outputs::MEM>(nid, newState);
}
