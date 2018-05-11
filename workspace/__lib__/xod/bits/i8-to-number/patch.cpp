
struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    int8_t byte = getValue<input_IN>(ctx);
    Number result = (Number)byte;
    emitValue<output_OUT>(ctx, result);
}
