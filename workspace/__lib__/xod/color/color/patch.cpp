
struct State {
};

struct Type {
    uint8_t r, g, b;
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    Type color;
    emitValue<output_OUT>(ctx, color);
}

