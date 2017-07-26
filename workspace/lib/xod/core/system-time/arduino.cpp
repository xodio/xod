struct State {
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid) {
    emitValue<Outputs::TIME>(nid, millis() / 1000.f);
}
