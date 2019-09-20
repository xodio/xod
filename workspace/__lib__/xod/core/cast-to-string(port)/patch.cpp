
#pragma XOD dirtieness disable

struct State {
    char str[5] = { 'D', 0, 0, 0, '\0' };
    CStringView view;
    State() : view(str) { }
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto state = getState(ctx);
    Number port = getValue<input_IN>(ctx);

    state->str[0] = port >= A0 ? 'A' : 'D';

    Number num = port >= A0 ? port - A0 : port;
    formatNumber(num, 0, &state->str[1]);
    emitValue<output_OUT>(ctx, XString(&state->view));
}
