#include <Wire.h>

node {
    meta {
        using Type = TwoWire*;
    }

    void evaluate(Context ctx) {
        Wire.begin();
        emitValue<output_OUT>(ctx, &Wire);
    }
}
