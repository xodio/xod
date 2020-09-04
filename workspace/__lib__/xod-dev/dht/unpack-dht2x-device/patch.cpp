node {
    static constexpr uint8_t constant_output_OUT = typeof_DEV::port;

    void evaluate(Context ctx) {
        // We don't need to worry about emitting from constant outputs.
        // Outputs will be always dirty on boot, and then the value will never change anyway.
    }
}
