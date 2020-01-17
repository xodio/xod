{{#global}}
#include <XColorPattern.h>
{{/global}}

struct State {
  PatternNode node;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto pattern = getValue<input_PAT>(ctx);
    auto color = getValue<input_C>(ctx);
    auto state = getState(ctx);

    if (isInputDirty<input_C>(ctx)) {
        state->node.setColor(color);
    }
    if (isSettingUp()) {
        pattern->add(&state->node);
    }

    emitValue<output_PATU0027>(ctx, pattern);
}
