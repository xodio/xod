{{#global}}
#include <XColorPattern.h>
{{/global}}

struct State {
    Pattern pattern;
};
using Type = Pattern*;

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto state = getState(ctx);
    emitValue<output_PAT>(ctx, &(state->pattern));
}
