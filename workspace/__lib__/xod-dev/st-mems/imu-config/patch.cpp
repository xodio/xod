node {
    meta {
        struct Device {
            Number reg4 = 0;
            Number mult = 1;
        };

        using Type = Device*;
    }

    Device dev;

    void evaluate(Context ctx) {
        dev.reg4 = getValue<input_REG4>(ctx);
        dev.mult = getValue<input_MULT>(ctx);

        emitValue<output_OUT>(ctx, &dev);
    }
}
