#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_PING
#pragma XOD error_raise enable

node {
    static const uint32_t HCSR04_MAX_START_US = 5000;
    static const uint32_t HCSR04_MAX_ROUNDTRIP_US =
        1000ul * 1000ul         // seconds to μs
        * 4ul                   // max meters
        * 2ul                   // to the moon and back
        / 340ul;                // sound speed

    enum Status {
        HCSR04_OK,
        HCSR04_NO_ECHO,
        HCSR04_WRONG_CONNECTION
    };

    Status pingSync(uint8_t echoPort, uint8_t trigPort, uint32_t* outRoundtripUs) {
        uint32_t maxUs;

        // Request measurement: make a pulse for 10 μs.
        pinMode(trigPort, OUTPUT);
        digitalWrite(trigPort, HIGH);
        delayMicroseconds(10);
        digitalWrite(trigPort, LOW);

        // Wait for echo pin rise which means ultrasonic burst success
        maxUs = micros() + HCSR04_MAX_START_US;
        pinMode(echoPort, INPUT);
        while (digitalRead(echoPort) == LOW) {
            if (micros() > maxUs)
                return HCSR04_WRONG_CONNECTION;
        }

        // Now wait for echo line to be pulled back low which means echo capture
        uint32_t tStart = micros();
        maxUs = tStart + HCSR04_MAX_ROUNDTRIP_US;
        while (digitalRead(echoPort) == HIGH) {
            if (micros() > maxUs)
                return HCSR04_NO_ECHO;
        }

        *outRoundtripUs = micros() - tStart;
        return HCSR04_OK;
    }

    void evaluate(Context ctx) {
        if (!isInputDirty<input_PING>(ctx))
            return;

        auto dev = getValue<input_DEV>(ctx);

        // TODO: static port validation
        if (!isValidDigitalPort(dev->echoPort) || !isValidDigitalPort(dev->trigPort)) {
            raiseError(ctx); // Invalid port
            return;
        }

        uint32_t t;
        auto status = pingSync(
            dev->echoPort,
            dev->trigPort,
            &t
        );

        if (status == HCSR04_OK) {
            emitValue<output_Ts>(ctx, Number(t) / 1000000.0);
            emitValue<output_DONE>(ctx, 1);
        } else if (status == HCSR04_NO_ECHO) {
            emitValue<output_Ts>(ctx, INFINITY);
            emitValue<output_DONE>(ctx, 1);
        } else {
            raiseError(ctx); // HCSR04_WRONG_CONNECTION
        }
    }
}
