
struct State {
    Number reg4 = 0;
    Number mult = 1;
};

using Type = State*;

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto cfg = getState(ctx);

    cfg->reg4 = getValue<input_REG4>(ctx);
    cfg->mult = getValue<input_MULT>(ctx);

    emitValue<output_OUT>(ctx, cfg);
}
