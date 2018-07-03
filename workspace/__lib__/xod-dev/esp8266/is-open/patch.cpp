
struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (!isInputDirty<input_UPD>(ctx))
        return;

    auto inet = getValue<input_INET>(ctx);
    if (inet.wifi->isSocketOpen()) {
        emitValue<output_YES>(ctx, 1);
    } else {
        emitValue<output_NO>(ctx, 1);
    }
}
