#pragma XOD error_raise enable

struct State {};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    if (!isInputDirty<input_READ>(ctx))
        return;

    auto inet = getValue<input_INET>(ctx);
    if (!inet.wifi->isSocketOpen()) {
        raiseError(ctx);
        return;
    }

    char r = '\0';
    if (inet.wifi->receive(&r)) {
        emitValue<output_CHAR>(ctx, (uint8_t)r);
        emitValue<output_DONE>(ctx, 1);
    } else {
        raiseError(ctx);
    }
}
