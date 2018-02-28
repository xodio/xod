
#pragma XOD dirtieness disable

struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto a = getValue<input_IN1>(ctx);
    auto b = getValue<input_IN2>(ctx);
    emitValue<output_OUT>(ctx, a && b);
}
