struct State {
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid) {
    emitValue<output_TICK>(nid, 1);
    setTimeout(nid, 0);
}
