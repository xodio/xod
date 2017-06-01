struct State {
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid, State* state) {
    emitValue<Outputs::TIME>(nid, millis() / 1000.f);
    emitValue<Outputs::RDY>(nid, 1);
}
