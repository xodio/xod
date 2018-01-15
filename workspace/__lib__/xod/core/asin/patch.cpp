
#pragma XOD dirtieness disable

struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    Number x = getValue<input_IN>(ctx);
    emitValue<output_RAD>(ctx, asin(x));
}
