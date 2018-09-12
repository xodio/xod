struct State {
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    auto uidA = getValue<input_IN1>(ctx);
    auto uidB = getValue<input_IN2>(ctx);
    bool eq = memcmp(uidA.items, uidB.items, sizeof(uidA.items)) == 0;
    emitValue<output_OUT>(ctx, eq);
}
