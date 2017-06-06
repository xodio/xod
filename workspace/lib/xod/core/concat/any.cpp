struct State {
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid, State* state) {
    auto head = getValue<Inputs::HEAD>(nid);
    auto tail = getValue<Inputs::TAIL>(nid);
    emitValue<Outputs::STR>(nid, head->concat(tail));
}
