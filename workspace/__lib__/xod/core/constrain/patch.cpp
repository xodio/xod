
#pragma XOD dirtieness disable

struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto x = getValue<input_X>(ctx);
    auto minX = getValue<input_MIN>(ctx);
    auto maxX = getValue<input_MAX>(ctx);
    emitValue<output_XC>(ctx, x < minX ? minX : (x > maxX ? maxX : x));
}
