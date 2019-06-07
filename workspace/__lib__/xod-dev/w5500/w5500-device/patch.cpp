#pragma XOD error_raise enable

struct State {
};

struct Type {
    uint8_t* mac;
    uint8_t cs;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto mac = getValue<input_MAC>(ctx);
    auto csPort = getValue<input_CS>(ctx);

    if (!isValidDigitalPort(csPort)) {
        raiseError(ctx, 255);
        return;
    }

    Type dev;
    dev.mac = mac;
    dev.cs = csPort;

    emitValue<output_DEV>(ctx, dev);
}
