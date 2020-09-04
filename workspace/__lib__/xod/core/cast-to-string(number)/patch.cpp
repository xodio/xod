
#pragma XOD dirtieness disable

node {
    char str[16];
    CStringView view = CStringView(str);

    void evaluate(Context ctx) {
        auto num = getValue<input_IN>(ctx);
        formatNumber(num, 2, str);
        emitValue<output_OUT>(ctx, XString(&view));
    }
}
