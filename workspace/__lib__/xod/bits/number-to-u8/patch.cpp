
struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    Number input = getValue<input_IN>(ctx);
    uint8_t byte = input;
    emitValue<output_OUT>(ctx, byte);
}
