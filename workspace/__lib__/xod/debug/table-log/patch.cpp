node {
    void printPrefix(Context ctx) {
        TimeMs tNow = transactionTime();
        XOD_DEBUG_SERIAL.print(F("+XOD:"));
        XOD_DEBUG_SERIAL.print(tNow);
        XOD_DEBUG_SERIAL.print(':');
        XOD_DEBUG_SERIAL.print(getNodeId(ctx));
        XOD_DEBUG_SERIAL.print(':');
    }
    void printEOL() {
        XOD_DEBUG_SERIAL.print('\r');
        XOD_DEBUG_SERIAL.print('\n');
        XOD_DEBUG_SERIAL.flush();
    }
    void evaluate(Context ctx) {
        if (isInputDirty<input_PUSH>(ctx)) {
            printPrefix(ctx);
            auto data = getValue<input_IN>(ctx);
            for (auto it = data.iterate(); it; ++it)
              XOD_DEBUG_SERIAL.print((char)*it);
            printEOL();
        }
        if (isInputDirty<input_NEW>(ctx)) {
            printPrefix(ctx);
            // Page break character -> new page
            XOD_DEBUG_SERIAL.print((char)0xC);
            printEOL();
        }
    }
}
