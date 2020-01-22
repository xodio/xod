
#pragma XOD dirtieness disable

struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto lhs = getValue<input_IN>(ctx);
    auto rhs = getValue<input_X1>(ctx);
    bool cond = (ctx, lhs == rhs);
    auto trueVal = getValue<input_Y1>(ctx);
    auto falseVal = getValue<input_DEF>(ctx);
    emitValue<output_OUT>(ctx, cond ? trueVal : falseVal);
}
