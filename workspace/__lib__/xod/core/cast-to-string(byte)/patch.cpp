
#pragma XOD dirtieness disable

node {
    char str[4] = { 0, 0, 'h', '\0' };
    CStringView view = CStringView(str);

    char nibbleToChar(uint8_t nibble) {
      return (nibble < 10)
        ? '0' + nibble
        : 'A' + nibble - 10;
    }

    void evaluate(Context ctx) {
        auto byte = getValue<input_IN>(ctx);

        str[0] = nibbleToChar(byte >> 4);
        str[1] = nibbleToChar(byte & 0x0F);

        emitValue<output_OUT>(ctx, XString(&view));
    }
}
