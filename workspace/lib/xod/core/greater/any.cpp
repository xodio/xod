struct State {
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid) {
    auto lhs = getValue<input_LHS>(nid);
    auto rhs = getValue<input_RHS>(nid);
    emitValue<output_GT>(nid, lhs > rhs);
}
