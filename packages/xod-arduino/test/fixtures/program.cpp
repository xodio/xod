/*=============================================================================
 *
 *
 * Program graph
 *
 *
 =============================================================================*/

namespace xod {

    //-------------------------------------------------------------------------
    // Dynamic data
    //-------------------------------------------------------------------------

    // Storage of #0 xod/math/multiply
    constexpr Number node_0_output_OUT = 42;
    xod__math__multiply::Storage storage_0 = {
        { }, // state
        node_0_output_OUT

    };

    // Storage of #1 xod/math/multiply
    constexpr Number node_1_output_OUT = 0;
    xod__math__multiply::Storage storage_1 = {
        { }, // state
        node_1_output_OUT

    };

    DirtyFlags g_dirtyFlags[NODE_COUNT] = {
        DirtyFlags(255),
        DirtyFlags(255)
    };

    TimeMs g_schedule[NODE_COUNT] = { 0 };

    //-------------------------------------------------------------------------
    // Static (immutable) data
    //-------------------------------------------------------------------------

    // Wiring of #0 xod/math/multiply
    const NodeId outLinks_0_OUT[] PROGMEM = { 1, NO_NODE };
    const xod__math__multiply::Wiring wiring_0 PROGMEM = {
        &xod__math__multiply::evaluate,
        // inputs (UpstreamPinRef’s initializers)
        { NO_NODE, 0, 0 }, // input_IN1
        { NO_NODE, 0, 0 }, // input_IN2
        // outputs (NodeId list binding)
        outLinks_0_OUT // output_OUT
    };

    // Wiring of #1 xod/math/multiply
    const NodeId outLinks_1_OUT[] PROGMEM = { NO_NODE };
    const xod__math__multiply::Wiring wiring_1 PROGMEM = {
        &xod__math__multiply::evaluate,
        // inputs (UpstreamPinRef’s initializers)
        { NodeId(0),
            xod__math__multiply::output_OUT::INDEX,
            xod__math__multiply::output_OUT::STORAGE_OFFSET }, // input_IN1
        { NO_NODE, 0, 0 }, // input_IN2
        // outputs (NodeId list binding)
        outLinks_1_OUT // output_OUT
    };

    // PGM array with pointers to PGM wiring information structs
    const void* const g_wiring[NODE_COUNT] PROGMEM = {
        &wiring_0,
        &wiring_1
    };

    // PGM array with pointers to RAM-located storages
    void* const g_storages[NODE_COUNT] PROGMEM = {
        &storage_0,
        &storage_1
    };
}
