#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_CONN
#pragma XOD error_raise enable

node {
    void evaluate(Context ctx) {
        if (!isInputDirty<input_CONN>(ctx))
            return;

        auto device = getValue<input_DEV>(ctx);

        auto ssid = getValue<input_SSID>(ctx);
        char _ssid[length(ssid) + 1] = { 0 };
        dump(ssid, _ssid);

        auto password = getValue<input_PWD>(ctx);
        char _password[length(password) + 1] = { 0 };
        dump(password, _password);

        bool done = device.wifi->connect(_ssid, _password);

        if (done) {
            emitValue<output_DONE>(ctx, 1);
        } else {
            raiseError(ctx); // Connection failed
        }
    }
}
