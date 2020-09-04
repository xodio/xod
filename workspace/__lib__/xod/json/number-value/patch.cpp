#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_IN2

nodespace {
    using ParserState = xod::json_parser::ParserState;
}

node {
    uint32_t integerResult = 0;
    uint32_t divider = 1;
    int8_t sign = 1;
    bool isParsingDecimalPart = false;
    ParserState prevParsedState;

    void evaluate(Context ctx) {
        auto parsed = getValue<input_IN1>(ctx);

        if (!isInputDirty<input_IN2>(ctx)) return;

        if (parsed.state == ParserState::IN_NUMBER) {
            if (parsed.character == '-') {
               sign = -1;
            } else if (parsed.character == '.') {
                isParsingDecimalPart = true;
            } else if (parsed.character >= '0' && parsed.character <= '9') {
                integerResult *= 10;
                integerResult += parsed.character - '0';

                if (isParsingDecimalPart)
                    divider *= 10;
            }
        } else if (prevParsedState == ParserState::IN_NUMBER) {
            Number result = (Number)integerResult / (Number)divider * (Number)sign;
            emitValue<output_OUT>(ctx, result);
            emitValue<output_DONE>(ctx, 1);

            integerResult = 0;
            divider = 1;
            sign = 1;
            isParsingDecimalPart = false;
        }

        prevParsedState = parsed.state;
    }
}
