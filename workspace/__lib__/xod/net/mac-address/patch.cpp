node {
    meta {
        using Type = uint8_t*;
    }

    uint8_t mac[6];

    void evaluate(Context ctx) {
        mac[0] = getValue<input_IN1>(ctx);
        mac[1] = getValue<input_IN2>(ctx);
        mac[2] = getValue<input_IN3>(ctx);
        mac[3] = getValue<input_IN4>(ctx);
        mac[4] = getValue<input_IN5>(ctx);
        mac[5] = getValue<input_IN6>(ctx);

        emitValue<output_OUT>(ctx, mac);
    }
}
