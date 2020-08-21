node {
    Number state = 0;

    void evaluate(Context ctx) {
        Number x = getValue<input_ST>(ctx);

        if (x != state) {
            state = x;
            TimeMs dt = getValue<input_Ts>(ctx) * 1000;
            setTimeout(ctx, dt);
        }

        if (isTimedOut(ctx)) {
            emitValue<output_OUT>(ctx, x);
        }
    }
}
