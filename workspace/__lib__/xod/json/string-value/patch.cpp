
using ParserState = xod::json_parser::ParserState;

struct State {
    char* buff;
    char* cursor;
    size_t cap;
    CStringView view;
    ParserState prevParsedState;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto state = getState(ctx);
    auto parsed = getValue<input_IN1>(ctx);

    if (isSettingUp()) {
        // save initial cap to ignore possible input changes during program execution
        state->cap = getValue<input_CAP>(ctx);
        state->buff = new char[state->cap + 1]; // +1 to make room for terminal '\0'
        state->view = CStringView(state->buff);
    }

    bool isStringStarting = state->prevParsedState != ParserState::IN_STRING && parsed.state == ParserState::IN_STRING;
    bool isStringFinished = state->prevParsedState == ParserState::IN_STRING && parsed.state != ParserState::IN_STRING;
    state->prevParsedState = parsed.state;

    if (isSettingUp() || isStringStarting) {
        // TODO: double buffer?
        memset(state->buff, '\0', state->cap + 1);
        state->cursor = state->buff;
        return; // first char is a '"', start accumulating from a next one
    }

    if (!isInputDirty<input_IN2>(ctx)) return;

    if (isStringFinished) {
        emitValue<output_OUT>(ctx, XString(&state->view));
        emitValue<output_DONE>(ctx, 1);
    } else if (state->cursor >= &state->buff[state->cap]) {
        // buffer is over capacity. raise error? emit existing value?
    } else {
        *state->cursor = parsed.character;
        state->cursor++;
    }
}
