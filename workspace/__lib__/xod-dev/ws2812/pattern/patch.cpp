#include <XColorPattern.h>

node {
    PatternNode node;

    void evaluate(Context ctx) {
        auto pattern = getValue<input_PAT>(ctx);
        auto color = getValue<input_C>(ctx);

        if (isInputDirty<input_C>(ctx)) {
            node.setColor(color);
        }
        if (isSettingUp()) {
            pattern->add(&node);
        }

        emitValue<output_PATU0027>(ctx, pattern);
    }
}
