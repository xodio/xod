/*=============================================================================
 *
 *
 * Native node implementations
 *
 *
 =============================================================================*/

namespace xod {

//-----------------------------------------------------------------------------
// xod/math/multiply implementation
//-----------------------------------------------------------------------------
namespace xod__math__multiply {

struct State {
};

struct Storage {
    State state;
    Number output_OUT;
};

struct Wiring {
    EvalFuncPtr eval;
    UpstreamPinRef input_IN1;
    UpstreamPinRef input_IN2;
    const NodeId* output_OUT;
};

State* getState(NodeId nid) {
    return reinterpret_cast<State*>(getStoragePtr(nid, 0));
}

using input_IN1 = InputDescriptor<Number, offsetof(Wiring, input_IN1)>;
using input_IN2 = InputDescriptor<Number, offsetof(Wiring, input_IN2)>;

using output_OUT = OutputDescriptor<Number, offsetof(Wiring, output_OUT), offsetof(Storage, output_OUT), 0>;

void evaluate(Context ctx) {
    /* Native implementation goes here */
}

} // namespace xod__math__multiply

} // namespace xod
