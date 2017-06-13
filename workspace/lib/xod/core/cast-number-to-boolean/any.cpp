struct State {
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid, State* state) {
    emitValue<Outputs::OUT>(nid, getValue<Inputs::IN>(nid) != 0.0);
}
