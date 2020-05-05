
node {
    void evaluate(Context ctx) {
        auto fractionalPart = fmod(getValue<input_X>(ctx), 1);
        auto peakPosition = constrain(getValue<input_PP>(ctx), 0.0, 1.0);

        // https://www.desmos.com/calculator/zddgvfpyao
        Number out = fractionalPart < peakPosition
            ? fractionalPart / peakPosition
            : ((fractionalPart - peakPosition) / (peakPosition - 1.0)) + 1.0;

        emitValue<output_OUT>(ctx, out);
    }
}
