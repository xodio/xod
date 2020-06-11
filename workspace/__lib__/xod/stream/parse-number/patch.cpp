
struct State {
    Number n = 0;
    Number fraction = 1.0;
    bool isNegative = false;
    bool isFraction = false;

    bool isDone = false;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto state = getState(ctx);

    if (isInputDirty<input_RST>(ctx)) {
        state->isDone = false;
        state->n = 0;
    }

    if (!isInputDirty<input_PUSH>(ctx) || state->isDone)
        return;

    auto c = getValue<input_CHAR>(ctx);

    bool isFraction = false;
    bool isNegative = false;
    Number fraction = 1.0;

    if (c == '-' && state->n == 0) {
        state->isNegative = true;
    } else if (c == '.' && !state->isFraction) {
        state->isFraction = true;
    } else if (c >= '0' && c <= '9') {
        state->n *= 10;
        state->n += c - '0';
        if (state->isFraction) {
            state->fraction *= 0.1;
        }
    } else {
        state->isDone = true;
        emitValue<output_END>(ctx, 1);
    }

    Number sign = state->isNegative ? -1 : 1;
    emitValue<output_NUM>(ctx, sign * state->n * state->fraction);
}
