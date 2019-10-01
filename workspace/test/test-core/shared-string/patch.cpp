
struct State {
    char str[1024] = { '\0' };
    CStringView view;
    State() : view(str) { }
};

using Type = State*;

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto state = getState(ctx);

    emitValue<output_OUT>(ctx, state);
}
