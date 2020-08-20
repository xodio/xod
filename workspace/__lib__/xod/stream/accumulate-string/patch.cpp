node {
    char* buff;
    char* cursor;
    size_t cap;
    CStringView view;

    void evaluate(Context ctx) {
        if (isSettingUp()) {
            // save initial cap to ignore possiple input changes during program execution
            cap = getValue<input_CAP>(ctx);
            buff = new char[cap + 1]; // +1 to make room for terminal '\0'
            view = CStringView(buff);
        }

        if (isSettingUp() || isInputDirty<input_RST>(ctx)) {
            memset(buff, '\0', cap + 1);
            cursor = buff;
        }

        if (isInputDirty<input_PUSH>(ctx)) {
            if (cursor >= &buff[cap]) {
                emitValue<output_FULL>(ctx, 1);
                return;
            }

            *cursor = getValue<input_CHAR>(ctx);
            cursor++;
            emitValue<output_STR>(ctx, XString(&view));
            emitValue<output_UPD>(ctx, 1);
        }
    }
}
