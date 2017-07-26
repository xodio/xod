struct State {
    Number value;
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid) {
    if (!isInputDirty<Inputs::UPD>(nid))
        return;

    State* state = getState(nid);
    auto newValue = getValue<Inputs::NEW>(nid);
    if (newValue == state->value)
        return;

    state->value = newValue;
    emitValue<Outputs::MEM>(nid, newValue);
}
