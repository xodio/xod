struct State {
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid) {
    auto head = getValue<input_HEAD>(nid);
    auto tail = getValue<input_TAIL>(nid);
    emitValue<output_STR>(nid, head->concat(tail));
}
