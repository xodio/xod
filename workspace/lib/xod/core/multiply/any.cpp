struct State {
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid) {
    auto x = getValue<Inputs::X>(nid);
    auto y = getValue<Inputs::Y>(nid);
    emitValue<Outputs::PROD>(nid, x * y);
}
