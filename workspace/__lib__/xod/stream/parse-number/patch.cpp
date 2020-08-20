node {
    Number n = 0;
    Number fraction = 1.0;
    bool isNegative = false;
    bool isFraction = false;

    bool isDone = false;

    void evaluate(Context ctx) {
        if (isInputDirty<input_RST>(ctx)) {
            isDone = false;
            n = 0;
        }

        if (!isInputDirty<input_PUSH>(ctx) || isDone)
            return;

        auto c = getValue<input_CHAR>(ctx);

        if (c == '-' && n == 0) {
            isNegative = true;
        } else if (c == '.' && !isFraction) {
            isFraction = true;
        } else if (c >= '0' && c <= '9') {
            n *= 10;
            n += c - '0';
            if (isFraction) {
                fraction *= 0.1;
            }
        } else {
            isDone = true;
            emitValue<output_END>(ctx, 1);
        }

        Number sign = isNegative ? -1 : 1;
        emitValue<output_NUM>(ctx, sign * n * fraction);
    }
}
