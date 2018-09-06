struct State {
};

struct Type {
    uint8_t items[7];
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    Type uid;
    uid.items[0] = (uint8_t)getValue<input_IN1>(ctx);
    uid.items[1] = (uint8_t)getValue<input_IN2>(ctx);
    uid.items[2] = (uint8_t)getValue<input_IN3>(ctx);
    uid.items[3] = (uint8_t)getValue<input_IN4>(ctx);
    uid.items[4] = (uint8_t)getValue<input_IN5>(ctx);
    uid.items[5] = (uint8_t)getValue<input_IN6>(ctx);
    uid.items[6] = (uint8_t)getValue<input_IN7>(ctx);

    emitValue<output_UID>(ctx, uid);
}
