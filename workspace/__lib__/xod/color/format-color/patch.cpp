
struct State {
    char str[7] = { 0, 0, 0, 0, 0, 0, '\0' };
    CStringView view;
    State() : view(str) { }
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

char nibbleToChar(uint8_t nibble) {
  return (nibble < 10)
    ? '0' + nibble
    : 'A' + nibble - 10;
}

void evaluate(Context ctx) {
    auto state = getState(ctx);
    auto color = getValue<input_IN>(ctx);

    state->str[0] = nibbleToChar(color.r >> 4);
    state->str[1] = nibbleToChar(color.r & 0x0F);
    state->str[2] = nibbleToChar(color.g >> 4);
    state->str[3] = nibbleToChar(color.g & 0x0F);
    state->str[4] = nibbleToChar(color.b >> 4);
    state->str[5] = nibbleToChar(color.b & 0x0F);

    emitValue<output_OUT>(ctx, XString(&state->view));
}
