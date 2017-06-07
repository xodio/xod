struct State {
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid, State* state) {
    auto a = getValue<Inputs::A>(nid);
    auto b = getValue<Inputs::B>(nid);
    emitValue<Outputs::AND>(nid, a && b);
}
