
#pragma XOD dirtieness disable

node {
    ConcatListView<char> view;

    void evaluate(Context ctx) {
        auto head = getValue<input_IN1>(ctx);
        auto tail = getValue<input_IN2>(ctx);
        view = ConcatListView<char>(head, tail);
        emitValue<output_OUT>(ctx, XString(&view));
    }
}
