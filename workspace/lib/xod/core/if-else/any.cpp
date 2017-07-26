struct State {
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid) {
    auto cond = getValue<input_COND>(nid);
    auto trueVal = getValue<input_T>(nid);
    auto falseVal = getValue<input_F>(nid);
    emitValue<output_R>(nid, cond ? trueVal : falseVal);
}
