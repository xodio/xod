/*=============================================================================
 *
 *
 * Native node implementations
 *
 *
 =============================================================================*/

namespace _program {

//-----------------------------------------------------------------------------
// xod/math/multiply implementation
//-----------------------------------------------------------------------------
namespace xod { namespace math { namespace multiply {

struct State {
};

struct Storage {
    State state;
    PinRef input_IN1;
    PinRef input_IN2;
    OutputPin<Number> output_OUT;
};

namespace Inputs {
    using IN1 = InputDescriptor<Number, offsetof(Storage, input_IN1)>;
    using IN2 = InputDescriptor<Number, offsetof(Storage, input_IN2)>;
}

namespace Outputs {
    using OUT = OutputDescriptor<Number, offsetof(Storage, output_OUT), 0>;
}

void evaluate(NodeId nid, State* state) {
    /* Native implementation goes here */
}

}}} // namespace xod::math::multiply

} // namespace _program
