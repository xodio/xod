
node {
    char str[7] = { 0, 0, 0, 0, 0, 0, '\0' };
    CStringView view = CStringView(str);

    char nibbleToChar(uint8_t nibble) {
      return (nibble < 10)
        ? '0' + nibble
        : 'A' + nibble - 10;
    }

    void evaluate(Context ctx) {
        auto color = getValue<input_IN>(ctx);

        str[0] = nibbleToChar(color.r >> 4);
        str[1] = nibbleToChar(color.r & 0x0F);
        str[2] = nibbleToChar(color.g >> 4);
        str[3] = nibbleToChar(color.g & 0x0F);
        str[4] = nibbleToChar(color.b >> 4);
        str[5] = nibbleToChar(color.b & 0x0F);

        emitValue<output_OUT>(ctx, XString(&view));
    }
}
