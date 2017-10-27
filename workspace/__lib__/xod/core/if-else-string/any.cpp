struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto cond = getValue<input_COND>(ctx);
    auto trueVal = getValue<input_T>(ctx);
    auto falseVal = getValue<input_F>(ctx);
    emitValue<output_R>(ctx, cond ? trueVal : falseVal);
}
