#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_IN2

nodespace {
    using ParserState = xod::json_parser::ParserState;
}

node {
    uint16_t depth = 0;
    uint16_t currentIndex = 0;

    void evaluate(Context ctx) {
        if (!isInputDirty<input_IN2>(ctx)) return;

        auto desiredIndex = getValue<input_N>(ctx);
        auto parsed = getValue<input_IN1>(ctx);

        if (parsed.state == ParserState::START_ARRAY && depth == 0)
            currentIndex = 0;

        if (parsed.state == ParserState::START_OBJECT || parsed.state == ParserState::START_ARRAY)
            depth++;

        bool shouldDecreaseDepth = parsed.state == ParserState::AFTER_OBJECT || parsed.state == ParserState::AFTER_ARRAY || parsed.state == ParserState::DONE;
        // trailing ']' and '}' that are passed to indicate end of the value should not decrease depth
        if (shouldDecreaseDepth && depth > 0)
            depth--;

        // do not pass opening '['
        if (parsed.state == ParserState::START_ARRAY && depth == 1)
            return;

        if (desiredIndex == currentIndex) {
            emitValue<output_OUT1>(ctx, parsed);
            emitValue<output_OUT2>(ctx, true);
        }

        bool valueHasEnded = depth == 1 && parsed.state == ParserState::IN_ARRAY;
        bool arrayHasEnded = depth == 0 && parsed.state == ParserState::AFTER_ARRAY;
        if (valueHasEnded || arrayHasEnded) {
            currentIndex++;
            return;
        }
    }
}
