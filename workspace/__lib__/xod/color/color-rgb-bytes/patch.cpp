
struct State {
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    ValueType<output_OUT>::T obj;
    obj = { (uint8_t)getValue<input_R>(ctx), (uint8_t)getValue<input_G>(ctx), (uint8_t)getValue<input_B>(ctx) };
    emitValue<output_OUT>(ctx, obj);
}
