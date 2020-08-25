node {
    void evaluate(Context ctx) {
        auto device = getValue<input_DEV>(ctx);

        emitValue<output_OUT>(ctx, device->status() == WL_CONNECTED);
        emitValue<output_DONE>(ctx, 1);
    }
}
