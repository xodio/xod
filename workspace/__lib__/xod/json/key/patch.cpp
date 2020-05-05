#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_IN2

using ParserState = xod::json_parser::ParserState;

enum Mode : uint8_t { waitingForKey, matchingKey, passingValue };

struct State {
    Iterator<char> searchedKeyIt = Iterator<char>::nil();
    Mode mode = waitingForKey;
    ParserState prevParsedState;
    uint16_t depth = 0;
    bool wasFound = false;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (!isInputDirty<input_IN2>(ctx)) return;

    auto state = getState(ctx);
    auto parsed = getValue<input_IN1>(ctx);

    if (parsed.state == ParserState::START_OBJECT || parsed.state == ParserState::START_ARRAY)
        state->depth++;

    bool shouldDecreaseDepth = parsed.state == ParserState::AFTER_OBJECT || parsed.state == ParserState::AFTER_ARRAY || parsed.state == ParserState::DONE;
    // trailing ']' and '}' that are passed to indicate end of the value should not decrease depth
    if (shouldDecreaseDepth && state->depth > 0)
        state->depth--;

    switch (state->mode) {
        case waitingForKey: {
            bool expectingAKey = state->prevParsedState == ParserState::START_OBJECT ||
                                 state->prevParsedState == ParserState::IN_OBJECT ||
                                 state->prevParsedState == ParserState::AFTER_VALUE;
            if (state->depth == 1 && expectingAKey && parsed.state == ParserState::IN_STRING) {
                auto keyNameStr = getValue<input_NAME>(ctx);
                state->searchedKeyIt = keyNameStr.iterate();
                state->mode = matchingKey;
                // the first char of a key is a '"'. we don't need it, so just get ready for the next character
            }
            break;
        }
        case matchingKey: {
            // matched the searched key
            if (!state->searchedKeyIt && parsed.state == ParserState::END_KEY) {
                state->mode = passingValue;
                state->wasFound = true;
                break;
            }

            bool oneOfComparedStringsHasEnded = !state->searchedKeyIt || parsed.state == ParserState::AFTER_KEY;
            if (oneOfComparedStringsHasEnded || *state->searchedKeyIt != parsed.character) {
                state->mode = waitingForKey;
                break;
            }

            ++(state->searchedKeyIt);
            break;
        }
        case passingValue: {
            // skipping delimiter between key and value,
            // waiting for a value to start
            if (parsed.state == ParserState::AFTER_KEY) break;

            bool valueEnded = state->depth <= 1 && (parsed.state == ParserState::IN_OBJECT || parsed.state == ParserState::AFTER_ARRAY || parsed.state == ParserState::AFTER_OBJECT);
            if (valueEnded || parsed.state == ParserState::DONE) {
                state->mode = waitingForKey;
            }

            emitValue<output_OUT1>(ctx, parsed);
            emitValue<output_OUT2>(ctx, true);
            break;
        }
    }

    // reached the end of object
    if (state->depth == 0 && (parsed.state == ParserState::AFTER_OBJECT || parsed.state == ParserState::DONE)) {
        if (!state->wasFound) raiseError(ctx);

        state->wasFound = false;
    }

    state->prevParsedState = parsed.state;
}
