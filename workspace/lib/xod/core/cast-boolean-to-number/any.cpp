struct State {
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid) {
    emitValue<output_OUT>(nid, getValue<Inputs::IN>(nid) ? 1.0 : 0.0);
}
