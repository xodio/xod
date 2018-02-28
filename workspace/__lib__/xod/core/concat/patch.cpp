
#pragma XOD dirtieness disable

struct State {
    ConcatListView<char> view;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto state = getState(ctx);
    auto head = getValue<input_IN1>(ctx);
    auto tail = getValue<input_IN2>(ctx);
    state->view = ConcatListView<char>(head, tail);
    emitValue<output_OUT>(ctx, XString(&state->view));
}
