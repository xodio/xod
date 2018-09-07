
struct State {
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    auto inValue = getValue<input_IN>(ctx);
    int32_t sec = getValue<input_T>(ctx);
    emitValue<output_OUT>(ctx, inValue + sec);
}
