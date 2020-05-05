#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_IN2
using ParserState = xod::json_parser::ParserState;

struct State {
    uint32_t integerResult = 0;
    uint32_t divider = 1;
    int8_t sign = 1;
    bool isParsingDecimalPart = false;
    ParserState prevParsedState;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto state = getState(ctx);
    auto parsed = getValue<input_IN1>(ctx);

    if (!isInputDirty<input_IN2>(ctx)) return;

    if (parsed.state == ParserState::IN_NUMBER) {
        if (parsed.character == '-') {
           state->sign = -1;
        } else if (parsed.character == '.') {
            state->isParsingDecimalPart = true;
        } else if (parsed.character >= '0' && parsed.character <= '9') {
            state->integerResult *= 10;
            state->integerResult += parsed.character - '0';

            if (state->isParsingDecimalPart)
                state->divider *= 10;
        }
    } else if (state->prevParsedState == ParserState::IN_NUMBER) {
        Number result = (Number)state->integerResult / (Number)state->divider * (Number)state->sign;
        emitValue<output_OUT>(ctx, result);
        emitValue<output_DONE>(ctx, 1);

        state->integerResult = 0;
        state->divider = 1;
        state->sign = 1;
        state->isParsingDecimalPart = false;
    }

    state->prevParsedState = parsed.state;
}
