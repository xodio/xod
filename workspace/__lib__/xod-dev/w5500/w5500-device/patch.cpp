node {
    meta {
        struct Type {
            uint8_t* mac;
            uint8_t cs;
        };
    }
    void evaluate(Context ctx) {
        static_assert(isValidDigitalPort(constant_input_CS), "must be a valid digital port");

        auto mac = getValue<input_MAC>(ctx);
        auto csPort = getValue<input_CS>(ctx);

        Type dev;
        dev.mac = mac;
        dev.cs = csPort;

        emitValue<output_DEV>(ctx, dev);
    }
}
