node {
    void evaluate(Context ctx) {
        auto inet = getValue<input_INET>(ctx);
        emitValue<output_IP>(ctx, (typeof_IP)inet.wifi->localIP());
    }
}
