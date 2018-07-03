
struct State {};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (!isInputDirty<input_UPD>(ctx))
        return;

    auto inet = getValue<input_INET>(ctx);
    if (!inet.wifi->isSocketOpen()) {
        emitValue<output_ERR>(ctx, 1);
        return;
    }

    char r = '\0';
    if (inet.wifi->receive(&r)) {
        emitValue<output_RES>(ctx, (uint8_t) r);
        emitValue<output_DONE>(ctx, 1);
    } else {
        emitValue<output_ERR>(ctx, 1);
    }
}
