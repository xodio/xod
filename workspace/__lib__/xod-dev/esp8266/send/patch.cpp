
struct State {
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    if (!isInputDirty<input_SEND>(ctx))
        return;

    auto req = getValue<input_MSG>(ctx);
    auto inet = getValue<input_INET>(ctx);

    char _req[length(req) + 1] = { 0 };
    dump(req, _req);

    if (inet.wifi->send(_req)) {
        emitValue<output_DONE>(ctx, 1);
    } else {
        emitValue<output_ERR>(ctx, 1);
    }
}
