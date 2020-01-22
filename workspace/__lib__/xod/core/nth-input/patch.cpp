
#pragma XOD dirtieness disable

struct State {};

int cond;

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto x = getValue<input_IDX>(ctx);
    auto y = 1;
    if (x < y){
     cond = 1;
    }else{cond = 0;}

    auto trueVal = getValue<input_X0>(ctx);
    auto falseVal = getValue<input_X1>(ctx);
    emitValue<output_OUT>(ctx, cond ? trueVal : falseVal);
    emitValue<output__>(ctx, x - 1);
}
