/*=============================================================================
 *
 *
 * Program graph
 *
 *
 =============================================================================*/

namespace _program {

    NodeId links_0_OUT[] = { 1, NO_NODE };
    xod__math__multiply::Storage storage_0 = {
        { }, // state
        { NO_NODE, 0 }, // input_IN1
        { NO_NODE, 0 }, // input_IN2
        { 42, links_0_OUT } // output_OUT
    };

    NodeId links_1_OUT[] = { NO_NODE };
    xod__math__multiply::Storage storage_1 = {
        { }, // state
        { NodeId(0), xod__math__multiply::Outputs::OUT::KEY }, // input_IN1
        { NO_NODE, 0 }, // input_IN2
        { 0, links_1_OUT } // output_OUT
    };

    void* storages[NODE_COUNT] = {
        &storage_0,
        &storage_1
    };

    EvalFuncPtr evaluationFuncs[NODE_COUNT] = {
        (EvalFuncPtr)&xod__math__multiply::evaluate,
        (EvalFuncPtr)&xod__math__multiply::evaluate
    };

    DirtyFlags dirtyFlags[NODE_COUNT] = {
        DirtyFlags(-1),
        DirtyFlags(-1)
    };

    NodeId topology[NODE_COUNT] = {
        0, 1
    };

    TimeMs schedule[NODE_COUNT] = { 0 };
}
