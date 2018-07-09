
struct State {
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    if (!isInputDirty<input_CONN>(ctx))
        return;

    auto host = getValue<input_HOST>(ctx);
    char _host[length(host) + 1] = { 0 };
    dump(host, _host);

    uint32_t port = (uint32_t)getValue<input_PORT>(ctx);

    auto inet = getValue<input_INET>(ctx);
    bool res = inet.wifi->createTCP(_host, port);

    if (res) {
        emitValue<output_SOCK>(ctx, 0);
        emitValue<output_DONE>(ctx, 1);
    } else {
        emitValue<output_ERR>(ctx, 1);
    }
}
