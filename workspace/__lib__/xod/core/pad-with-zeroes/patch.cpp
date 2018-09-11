struct State {
    char str[16];
    CStringView view;
    State()
        : view(str) {}
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    auto state = getState(ctx);

    auto num = (getValue<input_IN>(ctx) == 0) ? 0 : abs(getValue<input_IN>(ctx));
    int8_t lenFull = (getValue<input_W>(ctx) < 0) ? 0 : min(15, getValue<input_W>(ctx));
    char strNum[16];
    dtostrf(num, 0, 0, strNum);

    int8_t lenStr = strlen(strNum);
    size_t zeroCount =  max(0, lenFull - lenStr);
    memset(state->str, '0', zeroCount);
    strcpy(state->str + zeroCount, strNum);

    emitValue<output_OUT>(ctx, XString(&state->view));
}
