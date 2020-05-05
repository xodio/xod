#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_IN2
using ParserState = xod::json_parser::ParserState;

struct State {
    ParserState prevParsedState;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (!isInputDirty<input_IN2>(ctx)) return;

    auto state = getState(ctx);
    auto parsed = getValue<input_IN1>(ctx);

    if (parsed.state != state->prevParsedState) {
        if (state->prevParsedState == ParserState::IN_TRUE) {
            emitValue<output_OUT>(ctx, true);
            emitValue<output_DONE>(ctx, 1);
        } else if (state->prevParsedState == ParserState::IN_FALSE) {
            emitValue<output_OUT>(ctx, false);
            emitValue<output_DONE>(ctx, 1);
        }
    }

    state->prevParsedState = parsed.state;
}
