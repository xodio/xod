
#pragma XOD dirtieness disable

struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    emitValue<output_OUT>(ctx, getValue<input_IN>(ctx) != 0.0);
}
