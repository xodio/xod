struct State {
    CStringView view;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto state = getState(ctx);
    auto x = getValue<input_IN>(ctx);
    state->view = CStringView(x ? "true" : "false");
    emitValue<output_OUT>(ctx, XString(&state->view));
}
