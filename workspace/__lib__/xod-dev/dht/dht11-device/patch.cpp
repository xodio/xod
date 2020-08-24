node {
    meta {
      struct Type {
         static constexpr typeof_PORT port = constant_input_PORT;
      };
    }

    void evaluate(Context ctx) {
        static_assert(isValidDigitalPort(constant_input_PORT), "must be a valid digital port");

        // just to trigger downstream nodes
        emitValue<output_DEV>(ctx, {});
    }
}
