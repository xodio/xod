node {
    Number n = 0;
    bool isDone = false;

    void evaluate(Context ctx) {
        if (isInputDirty<input_RST>(ctx)) {
            isDone = false;
            n = 0;
        }

        if (!isInputDirty<input_PUSH>(ctx) || isDone)
            return;

        auto c = getValue<input_CHAR>(ctx);
        if (c >= '0' && c <= '9') {
            n *= 10;
            n += c - '0';
        } else {
            isDone = true;
            emitValue<output_END>(ctx, 1);
        }

        emitValue<output_NUM>(ctx, n);
    }
}
