
#pragma XOD dirtieness disable

node {
    char str[16];
    CStringView view = CStringView(str);

    void evaluate(Context ctx) {
        auto num = getValue<input_NUM>(ctx);
        auto dig = getValue<input_DIG>(ctx);
        formatNumber(num, dig, str);
        emitValue<output_STR>(ctx, XString(&view));
    }
}
