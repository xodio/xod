#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_IN2

nodespace {
    using ParserState = xod::json_parser::ParserState;
}

node {
    ParserState prevParsedState;

    void evaluate(Context ctx) {
        if (!isInputDirty<input_IN2>(ctx)) return;

        auto parsed = getValue<input_IN1>(ctx);

        if (parsed.state != prevParsedState) {
            if (prevParsedState == ParserState::IN_TRUE) {
                emitValue<output_OUT>(ctx, true);
                emitValue<output_DONE>(ctx, 1);
            } else if (prevParsedState == ParserState::IN_FALSE) {
                emitValue<output_OUT>(ctx, false);
                emitValue<output_DONE>(ctx, 1);
            }
        }

        prevParsedState = parsed.state;
    }
}
