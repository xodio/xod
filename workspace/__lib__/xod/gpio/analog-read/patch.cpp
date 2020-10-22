#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_UPD

node {
// reading from analog input too frequently may affect WiFi connection on ESP8266
// see https://github.com/krzychb/EspScopeA0/tree/master/Bravo#results
#ifdef ESP8266
    TimeMs lastReadTime = 0;
#endif

    void evaluate(Context ctx) {
        static_assert(isValidAnalogPort(constant_input_PORT), "must be a valid analog port");

        if (!isInputDirty<input_UPD>(ctx))
            return;

        ::pinMode(constant_input_PORT, INPUT);
#ifdef ESP8266
        if (transactionTime() - lastReadTime > 4) {
            lastReadTime = transactionTime();
            emitValue<output_VAL>(ctx, ::analogRead(constant_input_PORT) / 1023.);
        }
#else
        emitValue<output_VAL>(ctx, ::analogRead(constant_input_PORT) / 1023.);
#endif
        emitValue<output_DONE>(ctx, 1);
    }
}
