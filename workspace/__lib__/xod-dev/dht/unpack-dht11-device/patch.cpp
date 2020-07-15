
struct State {};

static const uint8_t constant_output_OUT = remove_pointer<typeof_DEV>::type::port;

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    // only to trigger evaluation of downstream nodes
    emitValue<output_OUT>(ctx, constant_output_OUT);
}
