#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_SEND
#pragma XOD error_raise enable

node {
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
            raiseError(ctx);
        }

        emitValue<output_INETU0027>(ctx, inet);
        emitValue<output_SOCKU0027>(ctx, getValue<input_SOCK>(ctx));
    }
}
