struct State {
    ConcatListView<char> view;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto state = getState(ctx);
    auto head = getValue<input_HEAD>(ctx);
    auto tail = getValue<input_TAIL>(ctx);
    state->view = ConcatListView<char>(head, tail);
    emitValue<output_STR>(ctx, XString(&state->view));
}
