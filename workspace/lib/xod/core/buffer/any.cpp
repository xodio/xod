struct State {
    Number value;
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid, State* state) {
    if (!isInputDirty<Inputs::UPD>(nid))
        return;

    auto newValue = getValue<Inputs::NEW>(nid);
    if (newValue == state->value)
        return;

    state->value = newValue;
    emitValue<Outputs::MEM>(nid, newValue);
}
