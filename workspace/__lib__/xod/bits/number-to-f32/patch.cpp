
struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    Number val = getValue<input_IN>(ctx);
    uint8_t* bytes = (uint8_t*)&val;

    emitValue<output_B3>(ctx, bytes[3]);
    emitValue<output_B2>(ctx, bytes[2]);
    emitValue<output_B1>(ctx, bytes[1]);
    emitValue<output_B0>(ctx, bytes[0]);
}
