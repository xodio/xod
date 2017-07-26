struct State {
    bool state = false;
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid) {
    State* state = getState(nid);
    bool newState = state->state;
    if (isInputDirty<input_TGL>(nid)) {
        newState = !state->state;
    } else if (isInputDirty<input_SET>(nid)) {
        newState = true;
    } else {
        newState = false;
    }

    if (newState == state->state)
        return;

    state->state = newState;
    emitValue<output_MEM>(nid, newState);
}
