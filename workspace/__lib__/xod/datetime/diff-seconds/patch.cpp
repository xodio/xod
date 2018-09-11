
struct State {
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    auto x = getValue<input_IN1>(ctx);
    auto y = getValue<input_IN2>(ctx);
    int32_t res = x > y ? x - y : -1 * (y - x);
    emitValue<output_OUT>(ctx, res);
}
