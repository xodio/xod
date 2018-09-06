struct State {
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    auto uid = getValue<input_UID>(ctx);

    emitValue<output_OUT1>(ctx, uid.items[0]);
    emitValue<output_OUT2>(ctx, uid.items[1]);
    emitValue<output_OUT3>(ctx, uid.items[2]);
    emitValue<output_OUT4>(ctx, uid.items[3]);
    emitValue<output_OUT5>(ctx, uid.items[4]);
    emitValue<output_OUT6>(ctx, uid.items[5]);
    emitValue<output_OUT7>(ctx, uid.items[6]);
}
