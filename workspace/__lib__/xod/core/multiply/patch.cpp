
#pragma XOD dirtieness disable

struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto x = getValue<input_IN1>(ctx);
    auto y = getValue<input_IN2>(ctx);
    emitValue<output_OUT>(ctx, x * y);
}
