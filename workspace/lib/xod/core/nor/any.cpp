struct State {
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid) {
    auto a = getValue<Inputs::A>(nid);
    auto b = getValue<Inputs::B>(nid);
    emitValue<Outputs::NOR>(nid, !(a || b));
}
