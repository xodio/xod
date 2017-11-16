
struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    Number x =
        ((uint8_t)getValue<input_HI>(ctx)) << 8 |
        ((uint8_t)getValue<input_LO>(ctx));

    emitValue<output_OUT>(ctx, x);
}
