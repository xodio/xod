#pragma XOD error_raise enable

#ifdef ESP32
#include <ESP32Servo.h>
#else
#include <Servo.h>
#endif

node {
    meta {
        /*
        A wrapper around the stock Servo object because we need to keep some details
        which the original object hides in private fields. This over-protection leads
        to increased RAM usage to duplicate the data. A pull request to the original
        library asking to add field read methods would be nice.
        */
        class XServo : public Servo {
          protected:
            // Here are the duplicates
            uint8_t port;
            int pulseMin;
            int pulseMax;

          public:
            // Set pulse duration according the given `value` and set pulseMin, pulseMax
            // The value is clipped to the [0; 1] range
            void write01(Number value) {
                ensureAttached();
                int pseudoAngle = constrain((int)(value * 180), 0, 180);
                this->write(pseudoAngle);
            }

            // Performs Servo::attach with the parameters set previously
            void ensureAttached() {
                if (this->attached())
                    return;

                this->attach(port, pulseMin, pulseMax);
            }

            Number read01() {
                int us = this->readMicroseconds();
                return (Number)(us - pulseMin) / (Number)(pulseMax - pulseMin);
            }

            void reattach(uint8_t port, int pulseMin, int pulseMax) {
                this->port = port;
                this->pulseMin = pulseMin;
                this->pulseMax = pulseMax;
                if (this->attached())
                    this->attach(port, pulseMin, pulseMax);
            }
        };

        using Type = XServo*;
    }

    XServo servo;

    void evaluate(Context ctx) {
        static_assert(isValidDigitalPort(constant_input_PORT), "must be a valid digital port");

        servo.reattach(
            constant_input_PORT,
            getValue<input_Pmin>(ctx),
            getValue<input_Pmax>(ctx)
        );

        emitValue<output_DEV>(ctx, &servo);
    }
}
