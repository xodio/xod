struct State {
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid) {
    auto x = getValue<input_X>(nid);
    emitValue<output_CEIL>(nid, ceil(x));
}
