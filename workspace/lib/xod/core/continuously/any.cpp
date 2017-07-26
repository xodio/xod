struct State {
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid) {
    emitValue<Outputs::TICK>(nid, 1);
    setTimeout(nid, 0);
}
