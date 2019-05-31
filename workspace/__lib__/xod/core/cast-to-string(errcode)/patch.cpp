
#pragma XOD dirtieness disable

struct State {
    char str[5]; // Exxx\0
    CStringView view;
    State() : view(str) { }
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto state = getState(ctx);
    auto errcode = getValue<input_IN>(ctx);

    char* str = state->str;

    do
        *str++ = (char)(48 + (errcode % 10));
    while (errcode /= 10);

    *str++ = 'E';
    *str = '\0';

    strreverse(state->str, str - 1);

    emitValue<output_OUT>(ctx, XString(&state->view));
}
