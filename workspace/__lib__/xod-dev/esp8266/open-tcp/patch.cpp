#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_CONN
#pragma XOD error_raise enable

node {
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
            raiseError(ctx);
        }

        emitValue<output_INETU0027>(ctx, inet);
    }
}
