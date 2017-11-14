struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    Number in1 = getValue<input_IN1>(ctx);
    Number in2 = getValue<input_IN2>(ctx);
    Number out = fmod(in1, in2);
    emitValue<output_OUT>(ctx, out);
}
