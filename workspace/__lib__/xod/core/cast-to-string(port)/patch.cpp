
#pragma XOD dirtieness disable

node {
    char str[5] = { 'D', 0, 0, 0, '\0' };
    CStringView view = CStringView(str);

    void evaluate(Context ctx) {
        Number port = getValue<input_IN>(ctx);

        str[0] = port >= A0 ? 'A' : 'D';

        Number num = port >= A0 ? port - A0 : port;
        formatNumber(num, 0, &str[1]);
        emitValue<output_OUT>(ctx, XString(&view));
    }
}
