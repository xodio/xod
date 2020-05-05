
#pragma XOD dirtieness disable

node {
    char str[16];
    CStringView view;

    void evaluate(Context ctx) {
        if (isSettingUp()) {
            view = CStringView(str);
        }

        auto num = getValue<input_IN>(ctx);
        formatNumber(num, 2, str);
        emitValue<output_OUT>(ctx, XString(&view));
    }
}
