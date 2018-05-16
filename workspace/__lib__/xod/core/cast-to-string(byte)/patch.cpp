
#pragma XOD dirtieness disable

struct State {
    char str[4] = { 0, 0, 'h', '\0' };
    CStringView view;
    State() : view(str) { }
};

{{ GENERATED_CODE }}

char nibbleToChar(uint8_t nibble) {
  return (nibble < 10)
    ? '0' + nibble
    : 'A' + nibble - 10;
}

void evaluate(Context ctx) {
    auto state = getState(ctx);
    auto byte = getValue<input_IN>(ctx);

    state->str[0] = nibbleToChar(byte >> 4);
    state->str[1] = nibbleToChar(byte & 0x0F);

    emitValue<output_OUT>(ctx, XString(&state->view));
}
