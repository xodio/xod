struct State {
    Number value;
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid) {
    if (!isInputDirty<input_UPD>(nid))
        return;

    State* state = getState(nid);
    auto newValue = getValue<input_NEW>(nid);
    if (newValue == state->value)
        return;

    state->value = newValue;
    emitValue<output_MEM>(nid, newValue);
}
