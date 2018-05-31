{{#global}}
#include <Wire.h>
{{/global}}

struct State {
};

using Type = TwoWire*;

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    Wire.begin();
    emitValue<output_OUT>(ctx, &Wire);
}
