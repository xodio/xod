
node {
    void evaluate(Context ctx) {
        Number micros = getValue<input_IN>(ctx);
        emitValue<output_OUT>(ctx, micros / 1000000 );
    }
}
