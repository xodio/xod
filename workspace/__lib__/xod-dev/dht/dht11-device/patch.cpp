
node {
    meta {
        struct Dht11Device {
            static constexpr uint8_t port = constant_input_PORT;
        };

        using Type = Dht11Device*;
    }

    void evaluate(Context ctx) {}
}
