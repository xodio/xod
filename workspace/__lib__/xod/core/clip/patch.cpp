
#pragma XOD dirtieness disable

struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto x = getValue<input_X>(ctx);
    auto rMin = getValue<input_MIN>(ctx);
    auto rMax = getValue<input_MAX>(ctx);
    auto xc =
        x > rMax ? rMax :
        x < rMin ? rMin : x;

    emitValue<output_Xc>(ctx, xc);
}
