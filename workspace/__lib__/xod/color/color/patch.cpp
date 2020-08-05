
node {
    meta {
        using Type = XColor;
    }

    void evaluate(Context ctx) {
        Type color = getValue<output_OUT>(ctx);
        emitValue<output_OUT>(ctx, color);
    }
}
