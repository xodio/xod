
#pragma XOD dirtieness disable

struct State {
    char str[16];
    CStringView view;
    State() : view(str) { }
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto state = getState(ctx);
    auto num = getValue<input_NUM>(ctx);
    auto dig = getValue<input_DIG>(ctx);
    formatNumber(num, dig, state->str);
    emitValue<output_STR>(ctx, XString(&state->view));
}
