nodespace {
    using ParserState = xod::json_parser::ParserState;
}

node {
    char* buff;
    char* cursor;
    size_t cap;
    CStringView view;
    ParserState prevParsedState;

    void evaluate(Context ctx) {
        auto parsed = getValue<input_IN1>(ctx);

        if (isSettingUp()) {
            // save initial cap to ignore possible input changes during program execution
            cap = getValue<input_CAP>(ctx);
            buff = new char[cap + 1]; // +1 to make room for terminal '\0'
            view = CStringView(buff);
        }

        bool isStringStarting = prevParsedState != ParserState::IN_STRING && parsed.state == ParserState::IN_STRING;
        bool isStringFinished = prevParsedState == ParserState::IN_STRING && parsed.state != ParserState::IN_STRING;
        prevParsedState = parsed.state;

        if (isSettingUp() || isStringStarting) {
            // TODO: double buffer?
            memset(buff, '\0', cap + 1);
            cursor = buff;
            return; // first char is a '"', start accumulating from a next one
        }

        if (!isInputDirty<input_IN2>(ctx)) return;

        if (isStringFinished) {
            emitValue<output_OUT>(ctx, XString(&view));
            emitValue<output_DONE>(ctx, 1);
        } else if (cursor >= &buff[cap]) {
            // buffer is over capacity. raise error? emit existing value?
        } else {
            *cursor = parsed.character;
            cursor++;
        }
    }
}
