
node {
    static void printAt(LiquidCrystal_I2C* lcd, uint8_t rowIndex, uint8_t posIndex, uint8_t len, XString str) {
        lcd->setCursor(posIndex, rowIndex);
        uint8_t whitespace = len;
        for (auto it = str.iterate(); it && whitespace > 0; ++it, --whitespace)
            lcd->write(*it);

        // Clear the rest of the area
        while (whitespace--)
            lcd->write(' ');
    }

    void evaluate(Context ctx) {
        auto t = getValue<input_DEV>(ctx);

        if (isInputDirty<input_DO>(ctx)) {
            XString str = getValue<input_VAL>(ctx);
            uint8_t row = (uint8_t) getValue<input_ROW>(ctx);
            uint8_t pos = (uint8_t) getValue<input_POS>(ctx);

            Number _len = getValue<input_LEN>(ctx);
            uint8_t restLen = t.cols - pos;
            uint8_t len = (_len > restLen) ? restLen : (uint8_t) _len;

            if (row < 0 || row >= t.rows || pos < 0 || pos >= t.cols) {
                raiseError<output_DONE>(ctx);
                return;
            }

            printAt(t.lcd, row, pos, len, str);
            emitValue<output_DONE>(ctx, 1);
        }

        emitValue<output_DEVU0027>(ctx, t);
    }
};
