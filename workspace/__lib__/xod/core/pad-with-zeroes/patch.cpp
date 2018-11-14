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

    auto val = getValue<input_IN>(ctx);
    auto num = (val == 0) ? 0 : abs(val);
    char strNum[16];
    formatNumber(num, 0, strNum);

    // If input value is NaN, Inf or OVF -> return without padding
    if (isnan(val) || isinf(val) || num > 0x7FFFFFFF) {
      strcpy(state->str, strNum);
      return;
    }

    int8_t lenFull = (getValue<input_W>(ctx) < 0) ? 0 : min((Number)15, getValue<input_W>(ctx));
    int8_t lenStr = strlen(strNum);
    size_t zeroCount =  max(0, lenFull - lenStr);
    memset(state->str, '0', zeroCount);
    strcpy(state->str + zeroCount, strNum);

    emitValue<output_OUT>(ctx, XString(&state->view));
}
