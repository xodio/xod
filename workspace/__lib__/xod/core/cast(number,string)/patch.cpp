
#pragma XOD dirtieness disable

struct State {
    char str[16];
    CStringView view;
    State() : view(str) { }
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto state = getState(ctx);
    auto num = getValue<input_IN>(ctx);
    dtostrf(num, 0, 2, state->str);
    emitValue<output_OUT>(ctx, XString(&state->view));
}
