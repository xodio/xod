
{{#global}}
#include <Servo.h>
{{/global}}

/*
  A wrapper around the stock Servo object because we need to keep some details
  which the original object hides in private fields. This over-protection leads
  to increased RAM usage to duplicate the data. The "proper" solution is to re-create
  the Servo library functionality and that’s a lot of work or make a fork with
  softer fields protection.
*/
struct XServo {
    Servo servo;
    uint16_t lockedFor;

    // Here are the duplicates
    bool shouldAttach = true;
    uint8_t port;
    int pulseMin;
    int pulseMax;

    // Set pulse duration according the given `value` and set pulseMin, pulseMax
    // The value is clipped to the [0; 1] range
    void write01(Number value) {
        ensureAttached();
        int pseudoAngle = constrain((int)(value * 180), 0, 180);
        servo.write(pseudoAngle);
    }

    // Performs Servo::attach with the parameters set previously
    void ensureAttached() {
        if (!shouldAttach && servo.attached())
            return;

        servo.attach(port, pulseMin, pulseMax);
        shouldAttach = false;
    }

    Number read01() const {
        int us = servo.readMicroseconds();
        return (Number)(us - pulseMin) / (Number)(pulseMax - pulseMin);
    }
};

using State = XServo;
using Type = XServo*;

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    State* state = getState(ctx);
    state->port = getValue<input_PORT>(ctx);
    state->pulseMin = getValue<input_Pmin>(ctx);
    state->pulseMax = getValue<input_Pmax>(ctx);
    state->shouldAttach = true;
    emitValue<output_DEV>(ctx, state);
}
