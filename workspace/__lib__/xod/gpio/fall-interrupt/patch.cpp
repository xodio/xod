nodespace {
    template<uint8_t PORT>
    struct Interrupt {
        volatile static uint32_t lastMicros;
        volatile static uint8_t counter;
        static bool attached;

        static void handler() {
            ++counter;
            lastMicros = micros();
        }
    };

    template<uint8_t PORT>
    volatile uint32_t Interrupt<PORT>::lastMicros = 0;

    template<uint8_t PORT>
    volatile uint8_t Interrupt<PORT>::counter = 0;

    template<uint8_t PORT>
    bool Interrupt<PORT>::attached = false;
}

node {
    uint32_t lastVal = 0;

    void evaluate(Context ctx) {
        static_assert(
            digitalPinToInterrupt(constant_input_PORT) != NOT_AN_INTERRUPT,
            "Port should support interrupts"
        );

        bool act = getValue<input_ACT>(ctx);

        if (act && !Interrupt<constant_input_PORT>::attached) {
            // Attach the interrupt if it is not attached yet
            ::pinMode(constant_input_PORT, INPUT);
            attachInterrupt(digitalPinToInterrupt(constant_input_PORT), Interrupt<constant_input_PORT>::handler, FALLING);
            Interrupt<constant_input_PORT>::attached = true;
        } else if (!act && Interrupt<constant_input_PORT>::attached) {
            // Detach the interrupt if it was attached and ACT is false now
            detachInterrupt(digitalPinToInterrupt(constant_input_PORT));
            Interrupt<constant_input_PORT>::attached = false;
        }

        // Check is the interrupt occurred and emit values and pulse
        uint32_t value = Interrupt<constant_input_PORT>::lastMicros;
        if (lastVal != value) {
            emitValue<output_OUT>(ctx, 1);
            emitValue<output_T>(ctx, value);
            emitValue<output_NUM>(ctx, Interrupt<constant_input_PORT>::counter);
            lastVal = value;
            Interrupt<constant_input_PORT>::counter = 0;
        }

        // Make it dirty on each transaction as long as ACT is true
        if (act) {
            setImmediate();
        }
    }
}
