#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_READ

struct State {
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    if (!isInputDirty<input_READ>(ctx))
        return;

    auto client = getValue<input_SOCK>(ctx);
    int b = client->read();
    if (b < 0) {
        emitValue<output_NA>(ctx, 1);
        return;
    }

    emitValue<output_B>(ctx, (uint8_t)b);
    emitValue<output_DONE>(ctx, 1);
}
