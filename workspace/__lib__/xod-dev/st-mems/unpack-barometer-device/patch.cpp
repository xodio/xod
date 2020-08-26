node {
    void evaluate(Context ctx) {
        auto dev = getValue<input_DEV>(ctx);
        emitValue<output_I2C>(ctx, dev->i2c);
        emitValue<output_ADDR>(ctx, dev->addr);
    }
}
