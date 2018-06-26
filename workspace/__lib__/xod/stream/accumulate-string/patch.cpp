
struct State {
    char* buff;
    char* cursor;
    size_t cap;
    CStringView view;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto state = getState(ctx);

    if (isSettingUp()) {
        // save initial cap to ignore possiple input changes during program execution
        state->cap = getValue<input_CAP>(ctx);
        state->buff = new char[state->cap + 1]; // +1 to make room for terminal '\0'
        state->view = CStringView(state->buff);
    }

    if (isSettingUp() || isInputDirty<input_RST>(ctx)) {
        memset(state->buff, '\0', state->cap + 1);
        state->cursor = state->buff;
    }

    if (isInputDirty<input_PUSH>(ctx)) {
        if (state->cursor >= &state->buff[state->cap]) {
            emitValue<output_FULL>(ctx, 1);
            return;
        }

        *state->cursor = getValue<input_CHAR>(ctx);
        state->cursor++;
        emitValue<output_STR>(ctx, XString(&state->view));
        emitValue<output_UPD>(ctx, 1);
    }
}
