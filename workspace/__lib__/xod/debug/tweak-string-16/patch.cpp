
struct State {
    char buff[17] = ""; // one extra for the '\0'
    CStringView view;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto state = getState(ctx);

    if (isSettingUp()) {
        state->view = CStringView(state->buff);
    }

    // Additional code that sets value of `buff`
    // is injected in detail::handleTweaks

    emitValue<output_OUT>(ctx, XString(&state->view));
}
