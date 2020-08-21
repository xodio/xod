
#pragma XOD dirtieness disable

node {
    CStringView view;

    void evaluate(Context ctx) {
        auto x = getValue<input_IN>(ctx);
        view = CStringView(x ? "true" : "false");
        emitValue<output_OUT>(ctx, XString(&view));
    }
}
