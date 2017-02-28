struct State {
};


struct Storage {
    State state;
    PinRef input_IN1;
    PinRef input_IN2;
    OutputPin<Number> output_OUT;
};

enum Inputs : PinKey {
    IN1 = offsetof(Storage, input_IN1),
    IN2 = offsetof(Storage, input_IN2)
};

enum Outputs : PinKey {
    OUT = offsetof(Storage, output_OUT) | (0 << PIN_KEY_OFFSET_BITS)
};


void evaluate(NodeId nid, State* state) {
    const Number in1 = getNumber(nid, Inputs::IN1);
    const Number in2 = getNumber(nid, Inputs::IN2);
    emitNumber(nid, Outputs::OUT, in1 * in2);
}
