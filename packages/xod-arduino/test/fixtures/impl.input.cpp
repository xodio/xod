struct State {
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid, State* state) {
    const Number in1 = getNumber(nid, Inputs::IN1);
    const Number in2 = getNumber(nid, Inputs::IN2);
    emitNumber(nid, Outputs::OUT, in1 * in2);
}
