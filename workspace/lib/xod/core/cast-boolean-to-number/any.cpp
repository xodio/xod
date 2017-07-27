struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    emitValue<output_OUT>(ctx, getValue<Inputs::IN>(nid) ? 1.0 : 0.0);
}
