
#pragma XOD dirtieness disable

struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    int32_t x = (int32_t)getValue<input_IN>(ctx);
    int32_t n = (int32_t)getValue<input_N>(ctx);
    int32_t b = 0;
    if (n < 0) {
      b = 0;
    } else if (n > 31) {
      b = 31;
    } else {
      b = n;
    }
    emitValue<output_OUT>(ctx, x << b);
}
