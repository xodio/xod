struct State {
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid) {
    auto x = getValue<Inputs::X>(nid);
    emitValue<Outputs::RND>(nid, round(x));
}
