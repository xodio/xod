node {
    meta {
        struct Type {
            TwoWire* wire;
            uint8_t addr;
        };
    }
    void evaluate(Context ctx) {
        Type dev;
        dev.addr = getValue<input_ADDR>(ctx);
        dev.wire = getValue<input_I2C>(ctx);
        emitValue<output_DEV>(ctx, dev);
    }
}
