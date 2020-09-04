
node {
    uint8_t _r = 0;
    uint8_t _g = 0;
    uint8_t _b = 0;

    bool isColorEqual(uint8_t r, uint8_t g, uint8_t b) {
        return (
            _r == r &&
            _g == g &&
            _b == b
        );
    }

    void evaluate(Context ctx) {
        auto newColor = getValue<input_IN>(ctx);

        if (!isSettingUp() && !isColorEqual(newColor.r, newColor.g, newColor.b));
            emitValue<output_OUT>(ctx, 1);

        _r = newColor.r;
        _g = newColor.g;
        _b = newColor.b;
    }
}
