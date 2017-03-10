
/*=============================================================================
 *
 *
 * Configuration
 *
 *
 =============================================================================*/

#define NODE_COUNT          8
#define MAX_OUTPUT_COUNT    1

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
namespace _program {
  namespace xod { namespace core { namespace digital_output {
    struct State {
    };

    struct Storage {
        State state;
        PinRef input_PIN;
        PinRef input_VALUE;
    };

    enum Inputs : PinKey {
        PIN = offsetof(Storage, input_PIN),
        VALUE = offsetof(Storage, input_VALUE)
    };

    enum Outputs : PinKey {
    };

    void evaluate(NodeId nid, State* state) {
        const int pin = (int)getNumber(nid, Inputs::PIN);
        const bool val = getLogic(nid, Inputs::VALUE);

        if (isInputDirty(nid, Inputs::PIN)) {
            ::pinMode(pin, OUTPUT);
        }

        ::digitalWrite(pin, val);
    }
  }}}

  namespace xod { namespace math { namespace multiply {
    struct State {
    };

    struct Storage {
        State state;
        PinRef input_A;
        PinRef input_B;
        OutputPin<Number> output_OUT;
    };

    enum Inputs : PinKey {
        A = offsetof(Storage, input_A),
        B = offsetof(Storage, input_B)
    };

    enum Outputs : PinKey {
        OUT = offsetof(Storage, output_OUT) | (0 << PIN_KEY_OFFSET_BITS)
    };

    void evaluate(NodeId nid, State* state) {
        const Number in1 = getNumber(nid, Inputs::A);
        const Number in2 = getNumber(nid, Inputs::B);
        emitNumber(nid, Outputs::OUT, in1 * in2);
    }
  }}}

  namespace xod { namespace core { namespace latch {
    struct State {
        bool value;
    };

    struct Storage {
        State state;
        PinRef input_RESET;
        PinRef input_SET;
        PinRef input_TOGGLE;
        OutputPin<Logic> output_STATE;
    };

    enum Inputs : PinKey {
        RESET = offsetof(Storage, input_RESET),
        SET = offsetof(Storage, input_SET),
        TOGGLE = offsetof(Storage, input_TOGGLE)
    };

    enum Outputs : PinKey {
        STATE = offsetof(Storage, output_STATE) | (0 << PIN_KEY_OFFSET_BITS)
    };

    void evaluate(NodeId nid, State* state) {
        if (isInputDirty(nid, Inputs::RESET)) {
            state->value = false;
        } else if (isInputDirty(nid, Inputs::SET)) {
            state->value = true;
        } else {
            state->value = !state->value;
        }

        emitLogic(nid, Outputs::STATE, state->value);
    }
  }}}

  namespace xod { namespace core { namespace clock {
    struct State {
        TimeMs nextTrig;
    };

    struct Storage {
        State state;
        PinRef input_INTERVAL;
        OutputPin<Logic> output_TICK;
    };

    enum Inputs : PinKey {
        INTERVAL = offsetof(Storage, input_INTERVAL)
    };

    enum Outputs : PinKey {
        TICK = offsetof(Storage, output_TICK) | (0 << PIN_KEY_OFFSET_BITS)
    };

    void evaluate(NodeId nid, State* state) {
        TimeMs tNow = transactionTime();
        TimeMs dt = getNumber(nid, Inputs::INTERVAL) * 1000;
        TimeMs tNext = tNow + dt;

        if (isInputDirty(nid, Inputs::INTERVAL)) {
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

  namespace xod { namespace core { namespace cast_number_to_boolean {
    struct State {
    };

    struct Storage {
        State state;
        PinRef input___IN__;
        OutputPin<Logic> output___OUT__;
    };

    enum Inputs : PinKey {
        __IN__ = offsetof(Storage, input___IN__)
    };

    enum Outputs : PinKey {
        __OUT__ = offsetof(Storage, output___OUT__) | (0 << PIN_KEY_OFFSET_BITS)
    };

    void evaluate(NodeId nid, State* state) {
        emitLogic(nid, Outputs::__OUT__, getNumber(nid, Inputs::__IN__));
    }
  }}}

  namespace xod { namespace core { namespace cast_boolean_to_number {
    struct State {
    };

    struct Storage {
        State state;
        PinRef input___IN__;
        OutputPin<Number> output___OUT__;
    };

    enum Inputs : PinKey {
        __IN__ = offsetof(Storage, input___IN__)
    };

    enum Outputs : PinKey {
        __OUT__ = offsetof(Storage, output___OUT__) | (0 << PIN_KEY_OFFSET_BITS)
    };

    void evaluate(NodeId nid, State* state) {
        emitNumber(nid, Outputs::__OUT__, getLogic(nid, Inputs::__IN__));
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
}
/*=============================================================================
 *
 *
 * Program graph
 *
 *
 =============================================================================*/

namespace _program {

    NodeId links_0_STATE[] = { 4, NO_NODE };
    xod::core::latch::Storage storage_0 = {
        { }, // state
        { NO_NODE, 0 }, // input_RESET
        { NO_NODE, 0 }, // input_SET
        { NodeId(5), xod::core::clock::Outputs::TICK }, // input_TOGGLE
        { false, links_0_STATE } // output_STATE
    };

    NodeId links_1___OUT__[] = { 2, NO_NODE };
    xod::core::cast_number_to_boolean::Storage storage_1 = {
        { }, // state
        { NodeId(3), xod::math::multiply::Outputs::OUT }, // input___IN__
        { false, links_1___OUT__ } // output___OUT__
    };

    xod::core::digital_output::Storage storage_2 = {
        { }, // state
        { NodeId(6), xod::core::constant_number::Outputs::VAL }, // input_PIN
        { NodeId(1), xod::core::cast_number_to_boolean::Outputs::__OUT__ }, // input_VALUE
    };

    NodeId links_3_OUT[] = { 1, NO_NODE };
    xod::math::multiply::Storage storage_3 = {
        { }, // state
        { NodeId(4), xod::core::cast_boolean_to_number::Outputs::__OUT__ }, // input_A
        { NodeId(4), xod::core::cast_boolean_to_number::Outputs::__OUT__ }, // input_B
        { 0, links_3_OUT } // output_OUT
    };

    NodeId links_4___OUT__[] = { 3, NO_NODE };
    xod::core::cast_boolean_to_number::Storage storage_4 = {
        { }, // state
        { NodeId(0), xod::core::latch::Outputs::STATE }, // input___IN__
        { 0, links_4___OUT__ } // output___OUT__
    };

    NodeId links_5_TICK[] = { 0, NO_NODE };
    xod::core::clock::Storage storage_5 = {
        { }, // state
        { NodeId(7), xod::core::constant_number::Outputs::VAL }, // input_INTERVAL
        { false, links_5_TICK } // output_TICK
    };

    NodeId links_6_VAL[] = { 2, NO_NODE };
    xod::core::constant_number::Storage storage_6 = {
        { }, // state
        { 13, links_6_VAL } // output_VAL
    };

    NodeId links_7_VAL[] = { 5, NO_NODE };
    xod::core::constant_number::Storage storage_7 = {
        { }, // state
        { 0.2, links_7_VAL } // output_VAL
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
        (EvalFuncPtr)&xod::core::latch::evaluate,
        (EvalFuncPtr)&xod::core::cast_number_to_boolean::evaluate,
        (EvalFuncPtr)&xod::core::digital_output::evaluate,
        (EvalFuncPtr)&xod::math::multiply::evaluate,
        (EvalFuncPtr)&xod::core::cast_boolean_to_number::evaluate,
        (EvalFuncPtr)&xod::core::clock::evaluate,
        (EvalFuncPtr)&xod::core::constant_number::evaluate,
        (EvalFuncPtr)&xod::core::constant_number::evaluate
    };

    DirtyFlags dirtyFlags[NODE_COUNT] = {
      DirtyFlags(0),
      DirtyFlags(0),
      DirtyFlags(0),
      DirtyFlags(0),
      DirtyFlags(0),
      DirtyFlags(0),
      DirtyFlags(-1),
      DirtyFlags(-1)
    };

    NodeId topology[NODE_COUNT] = {
      6, 7, 5, 0, 4, 3, 1, 2
    };

    TimeMs schedule[NODE_COUNT] = { 0 };
}
