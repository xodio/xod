
#pragma XOD dirtieness disable

struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    Number x = getValue<input_RAD>(ctx);
    emitValue<output_OUT>(ctx, tan(x));
}
