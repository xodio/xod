struct State {
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid, State* state) {
    emitValue<Outputs::TICK>(nid, 1);
    setTimeout(nid, 0);
}
