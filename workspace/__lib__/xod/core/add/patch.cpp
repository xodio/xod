struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto x = getValue<input_X>(ctx);
    auto y = getValue<input_Y>(ctx);
    emitValue<output_SUM>(ctx, x + y);
}
