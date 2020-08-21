node {
    void evaluate(Context ctx) {
        typeof_OUT obj;
        obj = { (uint8_t)getValue<input_R>(ctx), (uint8_t)getValue<input_G>(ctx), (uint8_t)getValue<input_B>(ctx) };
        emitValue<output_OUT>(ctx, obj);
    }
}
