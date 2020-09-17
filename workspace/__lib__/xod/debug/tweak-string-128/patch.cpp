
struct State {
    char buff[129]; // one extra for the '\0'
    CStringView view;

    State() : view(buff) {}
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto state = getState(ctx);

    // Additional code that sets value of `buff`
    // is injected in detail::handleTweaks

    emitValue<output_OUT>(ctx, XString(&state->view));
}
