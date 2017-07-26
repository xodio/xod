struct State {
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid) {
    auto cond = getValue<Inputs::COND>(nid);
    auto trueVal = getValue<Inputs::T>(nid);
    auto falseVal = getValue<Inputs::F>(nid);
    emitValue<Outputs::R>(nid, cond ? trueVal : falseVal);
}
