
/*=============================================================================
 *
 *
 * Configuration
 *
 *
 =============================================================================*/

#define NODE_COUNT          8
#define MAX_OUTPUT_COUNT    3

// Uncomment to trace the program in the Serial Monitor
//#define XOD_DEBUG

/*=============================================================================
 *
 *
 * Runtime
 *
 *
 =============================================================================*/

#include <Arduino.h>
#include <inttypes.h>

//----------------------------------------------------------------------------
// Debug routines
//----------------------------------------------------------------------------
#ifndef DEBUG_SERIAL
#  define DEBUG_SERIAL Serial
#endif

#ifdef XOD_DEBUG
#  define XOD_TRACE(x)      DEBUG_SERIAL.print(x)
#  define XOD_TRACE_LN(x)   DEBUG_SERIAL.println(x)
#  define XOD_TRACE_F(x)    XOD_TRACE(F(x))
#  define XOD_TRACE_FLN(x)  XOD_TRACE_LN(F(x))
#else
#  define XOD_TRACE(x)
#  define XOD_TRACE_LN(x)
#  define XOD_TRACE_F(x)
#  define XOD_TRACE_FLN(x)
#endif

//----------------------------------------------------------------------------
// Type definitions
//----------------------------------------------------------------------------
#define PIN_KEY_OFFSET_BITS     (16 - MAX_OUTPUT_COUNT)
#define NO_NODE                 ((NodeId)-1)

namespace _program {
    typedef double Number;
    typedef bool Logic;

    // OPTIMIZE: we should choose uint8_t if there are less than 255 nodes in total
    // and uint32_t if there are more than 65535
    typedef uint16_t NodeId;

    // OPTIMIZE: we should choose a proper type with a minimal enough capacity
    typedef uint16_t PinKey;

    // OPTIMIZE: we should choose a proper type with a minimal enough capacity
    typedef uint16_t DirtyFlags;

    typedef unsigned long TimeMs;
    typedef void (*EvalFuncPtr)(NodeId nid, void* state);
}

//----------------------------------------------------------------------------
// Engine
//----------------------------------------------------------------------------
namespace _program {
    extern void* storages[NODE_COUNT];
    extern EvalFuncPtr evaluationFuncs[NODE_COUNT];
    extern DirtyFlags dirtyFlags[NODE_COUNT];
    extern NodeId topology[NODE_COUNT];

    template<typename T>
    struct OutputPin {
        T value;
        // Keep outgoing link list with terminating `NO_NODE`
        NodeId* links;
    };

    struct PinRef {
        NodeId nodeId;
        PinKey pinKey;
    };


    // TODO: replace with a compact list
    extern TimeMs schedule[NODE_COUNT];

    inline void* pinPtr(void* storage, PinKey key) {
        const size_t offset = key & ~(PinKey(-1) << PIN_KEY_OFFSET_BITS);
        return (uint8_t*)storage + offset;
    }

    inline DirtyFlags dirtyPinBit(PinKey key) {
        const PinKey nbit = (key >> PIN_KEY_OFFSET_BITS) + 1;
        return 1 << nbit;
    }

    inline bool isOutputDirty(NodeId nid, PinKey key) {
        return dirtyFlags[nid] & dirtyPinBit(key);
    }

    inline bool isInputDirty(NodeId nid, PinKey key) {
        PinRef* ref = (PinRef*)pinPtr(storages[nid], key);
        if (ref->nodeId == NO_NODE)
            return false;

        return isOutputDirty(ref->nodeId, ref->pinKey);
    }

    inline void markPinDirty(NodeId nid, PinKey key) {
        dirtyFlags[nid] |= dirtyPinBit(key);
    }

    inline void markNodeDirty(NodeId nid) {
        dirtyFlags[nid] |= 0x1;
    }

    inline bool isNodeDirty(NodeId nid) {
        return dirtyFlags[nid] & 0x1;
    }

    TimeMs transactionTime() {
        return millis();
    }

    void setTimeout(NodeId nid, TimeMs timeout) {
        schedule[nid] = transactionTime() + timeout;
    }

    void clearTimeout(NodeId nid) {
        schedule[nid] = 0;
    }

    template<typename T>
    T getValue(NodeId nid, PinKey key) {
        PinRef* ref = (PinRef*)pinPtr(storages[nid], key);
        if (ref->nodeId == NO_NODE)
            return (T)0;

        return *(T*)pinPtr(storages[ref->nodeId], ref->pinKey);
    }

    Number getNumber(NodeId nid, PinKey key) {
        return getValue<Number>(nid, key);
    }

    Logic getLogic(NodeId nid, PinKey key) {
        return getValue<Logic>(nid, key);
    }

    template<typename T>
    void emitValue(NodeId nid, PinKey key, T value) {
        OutputPin<T>* outputPin = (OutputPin<T>*)pinPtr(storages[nid], key);

        outputPin->value = value;
        markPinDirty(nid, key);

        NodeId* linkedNode = outputPin->links;
        while (*linkedNode != NO_NODE) {
            markNodeDirty(*linkedNode++);
        }
    }

    void emitNumber(NodeId nid, PinKey key, Number value) {
        emitValue<Number>(nid, key, value);
    }

    void emitLogic(NodeId nid, PinKey key, Logic value) {
        emitValue<Logic>(nid, key, value);
    }

    template<typename T>
    void reemitValue(NodeId nid, PinKey key) {
        OutputPin<T>* outputPin = (OutputPin<T>*)pinPtr(storages[nid], key);
        emitValue<T>(nid, key, outputPin->value);
    }

    void reemitNumber(NodeId nid, PinKey key) {
        reemitValue<Number>(nid, key);
    }

    void reemitLogic(NodeId nid, PinKey key) {
        reemitValue<Logic>(nid, key);
    }

    void evaluateNode(NodeId nid) {
        XOD_TRACE_F("eval #");
        XOD_TRACE_LN(nid);
        EvalFuncPtr eval = evaluationFuncs[nid];
        eval(nid, storages[nid]);
    }

    void runTransaction() {
        XOD_TRACE_FLN("Transaction started");
        for (NodeId nid : topology) {
            if (isNodeDirty(nid))
                evaluateNode(nid);
        }

        memset(dirtyFlags, 0, sizeof(dirtyFlags));
        XOD_TRACE_FLN("Transaction completed");
    }

    void idle() {
        TimeMs now = millis();
        for (NodeId nid = 0; nid < NODE_COUNT; ++nid) {
            TimeMs t = schedule[nid];
            if (t && t <= now) {
                markNodeDirty(nid);
                clearTimeout(nid);
                return;
            }
        }
    }
}

//----------------------------------------------------------------------------
// Entry point
//----------------------------------------------------------------------------
void setup() {
    // FIXME: looks like there is a rounding bug. Waiting for 1 second fights it
    delay(1000);
#ifdef XOD_DEBUG
    DEBUG_SERIAL.begin(9600);
#endif
    XOD_TRACE_FLN("Program started");

    XOD_TRACE_F("NODE_COUNT = ");
    XOD_TRACE_LN(NODE_COUNT);

    XOD_TRACE_F("sizeof(NodeId) = ");
    XOD_TRACE_LN(sizeof(NodeId));

    XOD_TRACE_F("sizeof(PinKey) = ");
    XOD_TRACE_LN(sizeof(PinKey));

    XOD_TRACE_F("sizeof(DirtyFlags) = ");
    XOD_TRACE_LN(sizeof(DirtyFlags));
}

void loop() {
    _program::idle();
    _program::runTransaction();
}

/*=============================================================================
 *
 *
 * Native node implementations
 *
 *
 =============================================================================*/
namespace xod { namespace core { namespace real_to_logic {
    struct State {
    };

    struct Storage {
        State state;
        PinRef input_IN;
        OutputPin<Logic> output_OUT;
    };

    enum Inputs : PinKey {
        IN = offsetof(Storage, input_IN)
    };

    enum Outputs : PinKey {
        OUT = offsetof(Storage, output_OUT) | (0 << PIN_KEY_OFFSET_BITS)
    };

    void evaluate(NodeId nid, State* state) {
        emitLogic(nid, Outputs::OUT, getNumber(nid, Inputs::IN));
    }
}}}

namespace xod { namespace core { namespace logic_to_real {
    struct State {
    };

    struct Storage {
        State state;
        PinRef input_IN;
        OutputPin<Number> output_OUT;
    };

    enum Inputs : PinKey {
        IN = offsetof(Storage, input_IN)
    };

    enum Outputs : PinKey {
        OUT = offsetof(Storage, output_OUT) | (0 << PIN_KEY_OFFSET_BITS)
    };

    void evaluate(NodeId nid, State* state) {
        emitNumber(nid, Outputs::OUT, getLogic(nid, Inputs::IN));
    }
}}}

namespace xod { namespace core { namespace digital_output {
    struct State {
    };

    struct Storage {
        State state;
        PinRef input_VAL;
        PinRef input_PIN;
    };

    enum Inputs : PinKey {
        VAL = offsetof(Storage, input_VAL),
        PIN = offsetof(Storage, input_PIN)
    };

    enum Outputs : PinKey {
        // no outputs
    };

    void evaluate(NodeId nid, State* state) {
        const int pin = (int)getNumber(nid, Inputs::PIN);
        const bool val = getLogic(nid, Inputs::VAL);

        if (isInputDirty(nid, Inputs::PIN)) {
            ::pinMode(pin, OUTPUT);
        }

        ::digitalWrite(pin, val);
    }
}}}


namespace xod { namespace core { namespace multiply {
    struct State {
    };

    struct Storage {
        State state;
        PinRef input_IN1;
        PinRef input_IN2;
        OutputPin<Number> output_OUT;
    };

    enum Inputs : PinKey {
        IN1 = offsetof(Storage, input_IN1),
        IN2 = offsetof(Storage, input_IN2)
    };

    enum Outputs : PinKey {
        OUT = offsetof(Storage, output_OUT) | (0 << PIN_KEY_OFFSET_BITS)
    };

    void evaluate(NodeId nid, State* state) {
        const Number in1 = getNumber(nid, Inputs::IN1);
        const Number in2 = getNumber(nid, Inputs::IN2);
        emitNumber(nid, Outputs::OUT, in1 * in2);
    }
}}}

namespace xod { namespace core { namespace latch {
    struct State {
        bool value;
    };

    struct Storage {
        State state;
        PinRef input_TGL;
        PinRef input_SET;
        PinRef input_RST;
        OutputPin<Logic> output_OUT;
    };

    enum Inputs : PinKey {
        TGL = offsetof(Storage, input_TGL),
        SET = offsetof(Storage, input_SET),
        RST = offsetof(Storage, input_RST)
    };

    enum Outputs : PinKey {
        OUT = offsetof(Storage, output_OUT)
    };

    void evaluate(NodeId nid, State* state) {
        if (isInputDirty(nid, Inputs::RST)) {
            state->value = false;
        } else if (isInputDirty(nid, Inputs::SET)) {
            state->value = true;
        } else {
            state->value = !state->value;
        }

        emitLogic(nid, Outputs::OUT, state->value);
    }
}}}

namespace xod { namespace core { namespace clock {
    struct State {
        TimeMs nextTrig;
    };

    struct Storage {
        State state;
        PinRef input_IVAL;
        OutputPin<Logic> output_TICK;
    };

    enum Inputs : PinKey {
        IVAL = offsetof(Storage, input_IVAL)
    };

    enum Outputs : PinKey {
        TICK = offsetof(Storage, output_TICK) | (0 << PIN_KEY_OFFSET_BITS)
    };

    void evaluate(NodeId nid, State* state) {
        TimeMs tNow = transactionTime();
        TimeMs dt = getNumber(nid, Inputs::IVAL) * 1000;
        TimeMs tNext = tNow + dt;

        if (isInputDirty(nid, Inputs::IVAL)) {
            if (dt == 0) {
                state->nextTrig = 0;
                clearTimeout(nid);
            } else if (state->nextTrig < tNow || state->nextTrig > tNext) {
                state->nextTrig = tNext;
                setTimeout(nid, dt);
            }
        } else {
            // It was a scheduled tick
            emitLogic(nid, Outputs::TICK, 1);
            state->nextTrig = tNext;
            setTimeout(nid, dt);
        }
    }
}}}

namespace xod { namespace core { namespace constant_number {
    struct State {
    };

    struct Storage {
        State state;
        OutputPin<Number> output_VAL;
    };

    enum Inputs : PinKey {
    };

    enum Outputs : PinKey {
        VAL = offsetof(Storage, output_VAL) | (0 << PIN_KEY_OFFSET_BITS)
    };

    void evaluate(NodeId nid, State* state) {
        reemitNumber(nid, Outputs::VAL);
    }
}}}

/*=============================================================================
 *
 *
 * Program graph
 *
 *
 =============================================================================*/

namespace _program {
    NodeId links_0_VAL[] = { 1, NO_NODE };
    xod::core::constant_number::Storage storage_0 = {
        { }, // state
        { 0.2, links_0_VAL } // output_VAL
    };

    NodeId links_1_TICK[] = { 2, NO_NODE };
    xod::core::clock::Storage storage_1 = {
        { }, // state
        { NodeId(0), xod::core::constant_number::Outputs::VAL }, // input_IVAL
        { 0, links_1_TICK } // output_TICK
    };

    NodeId links_2_OUT[] = { 3, NO_NODE };
    xod::core::latch::Storage storage_2 = {
        { }, // state
        { 1, xod::core::clock::Outputs::TICK }, // input_TGL
        { NO_NODE, 0 }, // input_SET
        { NO_NODE, 0 }, // input_RST
        { 0, links_2_OUT } // output_OUT
    };

    NodeId links_3_OUT[] = { 4, NO_NODE };
    xod::core::logic_to_real::Storage storage_3 = {
        { }, // state
        { NodeId(2), xod::core::latch::Outputs::OUT }, // input_IN
        { 0, links_3_OUT } // output_OUT
    };

    NodeId links_4_OUT[] = { 5, NO_NODE };
    xod::core::multiply::Storage storage_4 = {
        { }, // state
        { NodeId(3), xod::core::logic_to_real::Outputs::OUT }, // input_IN1
        { NodeId(3), xod::core::logic_to_real::Outputs::OUT }, // input_IN2
        { 0, links_4_OUT } // output_OUT
    };

    NodeId links_5_OUT[] = { 7, NO_NODE };
    xod::core::real_to_logic::Storage storage_5 = {
        { }, // state
        { NodeId(4), xod::core::multiply::Outputs::OUT }, // input_IN
        { 0, links_5_OUT } // output_OUT
    };

    NodeId links_6_VAL[] = { 7, NO_NODE };
    xod::core::constant_number::Storage storage_6 = {
        { }, // state
        { 13, links_6_VAL } // output_VAL
    };

    NodeId links_7_VAL[] = { NO_NODE };
    xod::core::digital_output::Storage storage_7 = {
        { }, // state
        { NodeId(5), xod::core::real_to_logic::Outputs::OUT }, // input_VAL
        { NodeId(6), xod::core::constant_number::Outputs::VAL } // input_PIN
    };

    void* storages[NODE_COUNT] = {
        &storage_0,
        &storage_1,
        &storage_2,
        &storage_3,
        &storage_4,
        &storage_5,
        &storage_6,
        &storage_7
    };

    EvalFuncPtr evaluationFuncs[NODE_COUNT] = {
        (EvalFuncPtr)&xod::core::constant_number::evaluate,
        (EvalFuncPtr)&xod::core::clock::evaluate,
        (EvalFuncPtr)&xod::core::latch::evaluate,
        (EvalFuncPtr)&xod::core::logic_to_real::evaluate,
        (EvalFuncPtr)&xod::core::multiply::evaluate,
        (EvalFuncPtr)&xod::core::real_to_logic::evaluate,
        (EvalFuncPtr)&xod::core::constant_number::evaluate,
        (EvalFuncPtr)&xod::core::digital_output::evaluate
    };

    DirtyFlags dirtyFlags[NODE_COUNT] = {
        0xff, 0, 0, 0, 0, 0, 0xff, 0
    };

    NodeId topology[NODE_COUNT] = {
        0, 1, 2, 3, 4, 5, 6, 7
    };

    TimeMs schedule[NODE_COUNT] = { 0 };
}
