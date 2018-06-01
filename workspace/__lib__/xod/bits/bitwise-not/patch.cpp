
#pragma XOD dirtieness disable

struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto x = getValue<input_IN>(ctx);
    emitValue<output_OUT>(ctx, ~x);
}
