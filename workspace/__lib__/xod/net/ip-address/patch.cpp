struct State {
};

// because most other IPAdress classes can cast from/to uint32_t
using Type = uint32_t;

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    uint32_t octet1 = getValue<input_IN1>(ctx);
    uint32_t octet2 = getValue<input_IN2>(ctx);
    uint32_t octet3 = getValue<input_IN3>(ctx);
    uint32_t octet4 = getValue<input_IN4>(ctx);

    Type ip = octet4 << 24 | octet3 << 16 | octet2 << 8 | octet1;
    emitValue<output_OUT>(ctx, ip);
}
