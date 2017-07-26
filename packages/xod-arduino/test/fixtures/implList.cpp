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
namespace xod__math__multiply {

struct State {
};

struct Storage {
    State state;
    PinRef input_IN1;
    PinRef input_IN2;
    OutputPin<Number> output_OUT;
};

State* getState(NodeId nid) {
    return reinterpret_cast<State*>(storages[nid]);
}

using input_IN1 = InputDescriptor<Number, offsetof(Storage, input_IN1)>;
using input_IN2 = InputDescriptor<Number, offsetof(Storage, input_IN2)>;

using output_OUT = OutputDescriptor<Number, offsetof(Storage, output_OUT), 0>;

void evaluate(NodeId nid) {
    /* Native implementation goes here */
}

} // namespace xod__math__multiply

} // namespace _program
