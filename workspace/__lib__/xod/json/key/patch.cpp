#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_IN2

nodespace {
    using ParserState = xod::json_parser::ParserState;

    enum Mode : uint8_t { waitingForKey, matchingKey, passingValue };
}

node {
    Iterator<char> searchedKeyIt = Iterator<char>::nil();
    Mode mode = waitingForKey;
    ParserState prevParsedState;
    uint16_t depth = 0;
    bool wasFound = false;

    void evaluate(Context ctx) {
        if (!isInputDirty<input_IN2>(ctx)) return;

        auto parsed = getValue<input_IN1>(ctx);

        if (parsed.state == ParserState::START_OBJECT || parsed.state == ParserState::START_ARRAY)
            depth++;

        bool shouldDecreaseDepth = parsed.state == ParserState::AFTER_OBJECT || parsed.state == ParserState::AFTER_ARRAY || parsed.state == ParserState::DONE;
        // trailing ']' and '}' that are passed to indicate end of the value should not decrease depth
        if (shouldDecreaseDepth && depth > 0)
            depth--;

        switch (mode) {
            case waitingForKey: {
                bool expectingAKey = prevParsedState == ParserState::START_OBJECT ||
                                     prevParsedState == ParserState::IN_OBJECT ||
                                     prevParsedState == ParserState::AFTER_VALUE;
                if (depth == 1 && expectingAKey && parsed.state == ParserState::IN_STRING) {
                    auto keyNameStr = getValue<input_NAME>(ctx);
                    searchedKeyIt = keyNameStr.iterate();
                    mode = matchingKey;
                    // the first char of a key is a '"'. we don't need it, so just get ready for the next character
                }
                break;
            }
            case matchingKey: {
                // matched the searched key
                if (!searchedKeyIt && parsed.state == ParserState::END_KEY) {
                    mode = passingValue;
                    wasFound = true;
                    break;
                }

                bool oneOfComparedStringsHasEnded = !searchedKeyIt || parsed.state == ParserState::AFTER_KEY;
                if (oneOfComparedStringsHasEnded || *searchedKeyIt != parsed.character) {
                    mode = waitingForKey;
                    break;
                }

                ++(searchedKeyIt);
                break;
            }
            case passingValue: {
                // skipping delimiter between key and value,
                // waiting for a value to start
                if (parsed.state == ParserState::AFTER_KEY) break;

                bool valueEnded = depth <= 1 && (parsed.state == ParserState::IN_OBJECT || parsed.state == ParserState::AFTER_ARRAY || parsed.state == ParserState::AFTER_OBJECT);
                if (valueEnded || parsed.state == ParserState::DONE) {
                    mode = waitingForKey;
                }

                emitValue<output_OUT1>(ctx, parsed);
                emitValue<output_OUT2>(ctx, true);
                break;
            }
        }

        // reached the end of object
        if (depth == 0 && (parsed.state == ParserState::AFTER_OBJECT || parsed.state == ParserState::DONE)) {
            if (!wasFound) raiseError(ctx);

            wasFound = false;
        }

        prevParsedState = parsed.state;
    }
}
