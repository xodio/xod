struct State {
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid) {
    auto a = getValue<input_A>(nid);
    auto b = getValue<input_B>(nid);
    emitValue<output_AND>(nid, a && b);
}
