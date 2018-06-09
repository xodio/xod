
struct State {
    TimeMs cooldownUntil = 0;
};

{{ GENERATED_CODE }}

constexpr uint32_t HCSR04_COOLDOWN_MS = 60;
constexpr uint32_t HCSR04_MAX_START_US = 5000;
constexpr uint32_t HCSR04_MAX_ROUNDTRIP_US =
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

    auto state = getState(ctx);
    if (millis() < state->cooldownUntil)
        return;

    auto echoPort = (uint8_t)getValue<input_ECHO>(ctx);
    auto trigPort = (uint8_t)getValue<input_TRIG>(ctx);

    uint32_t t;
    auto status = pingSync(
        (uint8_t)getValue<input_ECHO>(ctx),
        (uint8_t)getValue<input_TRIG>(ctx),
        &t
    );

    // We should not ping too often as the PCB of the sensor could resonate
    state->cooldownUntil = millis() + HCSR04_COOLDOWN_MS;

    if (status == HCSR04_OK) {
        emitValue<output_Ts>(ctx, Number(t) / 1000000.0);
        emitValue<output_DONE>(ctx, 1);
    } else {
        emitValue<output_ERR>(ctx, 1);
    }
}
