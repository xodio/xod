/*=============================================================================
 *
 *
 * Program graph
 *
 *
 =============================================================================*/

namespace _program {
    NodeId links_0_OUT[] = { 1, NO_NODE };
    xod::math::multiply::Storage storage_0 = {
        { }, // state
        { NO_NODE, 0 }, // input_IN1
        { NO_NODE, 0 }, // input_IN2
        { 5, links_0_OUT } // output_OUT
    };

    NodeId links_1_OUT[] = { NO_NODE };
    xod::math::multiply::Storage storage_1 = {
        { }, // state
        { NodeId(0), xod::math::multiply::Outputs::OUT }, // input_IN1
        { NO_NODE, 0 }, // input_IN2
        { 0, links_1_OUT } // output_OUT
    };

    void* storages[NODE_COUNT] = {
        &storage_0,
        &storage_1
    };

    EvalFuncPtr evaluationFuncs[NODE_COUNT] = {
        (EvalFuncPtr)&xod::math::multiply::evaluate,
        (EvalFuncPtr)&xod::math::multiply::evaluate
    };

    DirtyFlags dirtyFlags[NODE_COUNT] = {
        DirtyFlags(0),
        DirtyFlags(0)
    };

    NodeId topology[NODE_COUNT] = {
        0, 1
    };

    TimeMs schedule[NODE_COUNT] = { 0 };
}
