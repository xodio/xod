node {
    int pos = 0;
    int _length;

    char charAt(XString str, int pos) {
        auto it = str.iterate();
        for (int i = 0; i < pos; i++) {
            ++it;
        }

        return *it;
    }

    void evaluate(Context ctx) {
        auto str = getValue<input_SEQ>(ctx);

        if (isInputDirty<input_SEQ>(ctx)) {
            _length = length(str);
            pos = 0;
        }

        if (!isInputDirty<input_IN2>(ctx))
            return;

        auto c = getValue<input_IN1>(ctx);
        if (c == charAt(str, pos)) {
            pos++;

            // it was the last char in a string
            if (pos == _length) {
                emitValue<output_OUT>(ctx, 1);
                // we will start over on next pulse
                pos = 0;
            }
        } else {
            // we will start over on next pulse
            pos = 0;
        }
    }
}
