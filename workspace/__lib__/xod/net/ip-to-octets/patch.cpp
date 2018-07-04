
struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto ip = getValue<input_IN>(ctx);

    auto octets = reinterpret_cast<uint8_t*>(&ip);

    emitValue<output_OUT1>(ctx, octets[0]);
    emitValue<output_OUT2>(ctx, octets[1]);
    emitValue<output_OUT3>(ctx, octets[2]);
    emitValue<output_OUT4>(ctx, octets[3]);
}
