struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto head = getValue<input_HEAD>(ctx);
    auto tail = getValue<input_TAIL>(ctx);
    emitValue<output_STR>(ctx, head->concat(tail));
}
