node {
    meta {
        using Type = uint8_t;
    }
    void evaluate(Context ctx) {
      emitValue<output_OUT>(ctx, 0);
    }
}
