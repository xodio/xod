
struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto inValue = getValue<input_IN>(ctx);
    emitValue<output_OUT>(ctx, isnan(inValue));
}
