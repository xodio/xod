struct State {
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid) {
    auto x = getValue<input_X>(nid);
    auto y = getValue<input_Y>(nid);
    emitValue<output_PROD>(nid, x * y);
}
