struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    emitValue<output_OUT>(ctx, getValue<Inputs::IN>(nid) != 0.0);
}
