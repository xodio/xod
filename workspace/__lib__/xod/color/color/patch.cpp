
struct State {
};

using Type = XColor;

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    Type color = getValue<output_OUT>(ctx);
    emitValue<output_OUT>(ctx, color);
}

