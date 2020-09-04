node {
    meta {
        struct Device {
            static constexpr typeof_ECHO echoPort = constant_input_ECHO;
            static constexpr typeof_TRIG trigPort = constant_input_TRIG;
        };
        Device dev;
        using Type = Device*;
    }
    void evaluate(Context ctx) {
        pinMode(dev.trigPort, OUTPUT);
        pinMode(dev.echoPort, INPUT);
        emitValue<output_OUT>(ctx, &dev);
    }
}
