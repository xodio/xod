struct State {
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid) {
    emitValue<output_TIME>(nid, millis() / 1000.f);
}
