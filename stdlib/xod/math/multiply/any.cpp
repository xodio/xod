struct State {
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid, State* state) {
    const Number in1 = getNumber(nid, Inputs::A);
    const Number in2 = getNumber(nid, Inputs::B);
    emitNumber(nid, Outputs::OUT, in1 * in2);
}
