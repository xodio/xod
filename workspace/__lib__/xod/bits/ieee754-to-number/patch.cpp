
struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    uint8_t bytes[4];

    bytes[0] = getValue<input_B0>(ctx);
    bytes[1] = getValue<input_B1>(ctx);
    bytes[2] = getValue<input_B2>(ctx);
    bytes[3] = getValue<input_B3>(ctx);

    Number output = *(Number*)bytes;

    emitValue<output_OUT>(ctx, output);
}
