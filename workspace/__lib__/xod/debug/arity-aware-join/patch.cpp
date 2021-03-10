
node {
    ConcatListView<char> accPlusDelimiter;
    ConcatListView<char> result;

    void evaluate(Context ctx) {
        auto arity = getValue<input_AR>(ctx);
        emitValue<output_ARU0027>(ctx, arity + 1);

        auto input = getValue<input_IN>(ctx);

        if (arity == 0) {
            emitValue<output_OUT>(ctx, input);
            return;
        }

        auto acc = getValue<input_ACC>(ctx);
        auto delimeter = getValue<input_D>(ctx);
        accPlusDelimiter = ConcatListView<char>(acc, delimeter);
        result = ConcatListView<char>(XString(&accPlusDelimiter), input);
        emitValue<output_OUT>(ctx, XString(&result));
    }
}
