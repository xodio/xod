struct State {
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid) {
    auto x = getValue<Inputs::X>(nid);
    auto minX = getValue<Inputs::MIN>(nid);
    auto maxX = getValue<Inputs::MAX>(nid);
    emitValue<Outputs::XC>(nid, x < minX ? minX : (x > maxX ? maxX : x));
}
