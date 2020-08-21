
#pragma XOD dirtieness disable

node {
    void evaluate(Context ctx) {
        emitValue<output_TIME>(ctx, millis() / 1000.f);
    }
}
