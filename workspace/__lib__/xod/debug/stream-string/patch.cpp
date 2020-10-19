node {
    Iterator<char> it = Iterator<char>::nil();

    void evaluate(Context ctx) {
        if (isInputDirty<input_IN>(ctx)) {
            auto str = getValue<input_IN>(ctx);
            it = str.iterate();
        }

        if (it) {
            emitValue<output_OUT1>(ctx, *it);
            emitValue<output_OUT2>(ctx, true);
            ++it;
            setImmediate();
        }
    }
}
