/*=============================================================================
 *
 *
 * Configuration
 *
 *
 =============================================================================*/

#define NODE_COUNT          9
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
  namespace xod { namespace core { namespace greater {
  struct State {};


struct Storage {
    State state;
    PinRef input_LHS;
    PinRef input_RHS;
    OutputPin<Logic> output_GT;
};

enum Inputs : PinKey {
    LHS = offsetof(Storage, input_LHS),
    RHS = offsetof(Storage, input_RHS)
};

enum Outputs : PinKey {
    GT = offsetof(Storage, output_GT) | (0 << PIN_KEY_OFFSET_BITS)
};


void evaluate(NodeId nid, State* state) {
  double lhs = getNumber(nid, Inputs::LHS);
  double rhs = getNumber(nid, Inputs::RHS);
  bool result = (lhs > rhs);

  emitLogic(nid, Outputs::GT, result);
}

  }}}
  namespace xod { namespace core { namespace clock {
  struct State {
  TimeMs nextTrig;
};


struct Storage {
    State state;
    PinRef input_IVAL;
    PinRef input_RST;
    OutputPin<Logic> output_TICK;
};

enum Inputs : PinKey {
    IVAL = offsetof(Storage, input_IVAL),
    RST = offsetof(Storage, input_RST)
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
  namespace xod { namespace core { namespace digital_output {
  struct State {
};


struct Storage {
    State state;
    PinRef input_PORT;
    PinRef input_SIG;
    PinRef input_UPD;
};

enum Inputs : PinKey {
    PORT = offsetof(Storage, input_PORT),
    SIG = offsetof(Storage, input_SIG),
    UPD = offsetof(Storage, input_UPD)
};

enum Outputs : PinKey {
};


void evaluate(NodeId nid, State* state) {
    const int pin = (int)getNumber(nid, Inputs::PORT);
    const bool val = getLogic(nid, Inputs::SIG);

    if (isInputDirty(nid, Inputs::PORT)) {
        ::pinMode(pin, OUTPUT);
    }

    ::digitalWrite(pin, val);
}

  }}}
  namespace xod { namespace core { namespace analog_input {
  struct State {};


struct Storage {
    State state;
    PinRef input_PORT;
    PinRef input_UPD;
    OutputPin<Number> output_VAL;
};

enum Inputs : PinKey {
    PORT = offsetof(Storage, input_PORT),
    UPD = offsetof(Storage, input_UPD)
};

enum Outputs : PinKey {
    VAL = offsetof(Storage, output_VAL) | (0 << PIN_KEY_OFFSET_BITS)
};


void evaluate(NodeId nid, State* state) {
  const int pin = (int)getNumber(nid, Inputs::PORT);
  const bool val = getLogic(nid, Inputs::UPD);
  const Number pinValue = analogRead(pin) / 1023.00;

  if (isInputDirty(nid, Inputs::PORT)) {
      ::pinMode(pin, INPUT);
  }

  emitNumber(nid, Outputs::VAL, pinValue);
}

  }}}
  namespace xod { namespace core { namespace constant_number {
  struct State {};


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
  namespace xod { namespace core { namespace constant_logic {
  struct State {
};


struct Storage {
    State state;
    OutputPin<Logic> output_VAL;
};

enum Inputs : PinKey {
};

enum Outputs : PinKey {
    VAL = offsetof(Storage, output_VAL) | (0 << PIN_KEY_OFFSET_BITS)
};


void evaluate(NodeId nid, State* state) {
    reemitLogic(nid, Outputs::VAL);
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

    NodeId links_0_GT[] = { 2, NO_NODE };
    xod::core::greater::Storage storage_0 = {
        { }, // state
        { NodeId(3), xod::core::analog_input::Outputs::VAL }, // input_LHS
        { NodeId(4), xod::core::constant_number::Outputs::VAL }, // input_RHS
        { false, links_0_GT } // output_GT
    };

    NodeId links_1_TICK[] = { 2, 3, NO_NODE };
    xod::core::clock::Storage storage_1 = {
        { }, // state
        { NodeId(5), xod::core::constant_number::Outputs::VAL }, // input_IVAL
        { NodeId(6), xod::core::constant_logic::Outputs::VAL }, // input_RST
        { false, links_1_TICK } // output_TICK
    };

    xod::core::digital_output::Storage storage_2 = {
        { }, // state
        { NodeId(7), xod::core::constant_number::Outputs::VAL }, // input_PORT
        { NodeId(0), xod::core::greater::Outputs::GT }, // input_SIG
        { NodeId(1), xod::core::clock::Outputs::TICK }, // input_UPD
    };

    NodeId links_3_VAL[] = { 0, NO_NODE };
    xod::core::analog_input::Storage storage_3 = {
        { }, // state
        { NodeId(8), xod::core::constant_number::Outputs::VAL }, // input_PORT
        { NodeId(1), xod::core::clock::Outputs::TICK }, // input_UPD
        { 0, links_3_VAL } // output_VAL
    };

    NodeId links_4_VAL[] = { 0, NO_NODE };
    xod::core::constant_number::Storage storage_4 = {
        { }, // state
        { 0.33, links_4_VAL } // output_VAL
    };

    NodeId links_5_VAL[] = { 1, NO_NODE };
    xod::core::constant_number::Storage storage_5 = {
        { }, // state
        { 0.2, links_5_VAL } // output_VAL
    };

    NodeId links_6_VAL[] = { 1, NO_NODE };
    xod::core::constant_logic::Storage storage_6 = {
        { }, // state
        { false, links_6_VAL } // output_VAL
    };

    NodeId links_7_VAL[] = { 2, NO_NODE };
    xod::core::constant_number::Storage storage_7 = {
        { }, // state
        { 7, links_7_VAL } // output_VAL
    };

    NodeId links_8_VAL[] = { 3, NO_NODE };
    xod::core::constant_number::Storage storage_8 = {
        { }, // state
        { 18, links_8_VAL } // output_VAL
    };

    void* storages[NODE_COUNT] = {
        &storage_0,
        &storage_1,
        &storage_2,
        &storage_3,
        &storage_4,
        &storage_5,
        &storage_6,
        &storage_7,
        &storage_8
    };

    EvalFuncPtr evaluationFuncs[NODE_COUNT] = {
        (EvalFuncPtr)&xod::core::greater::evaluate,
        (EvalFuncPtr)&xod::core::clock::evaluate,
        (EvalFuncPtr)&xod::core::digital_output::evaluate,
        (EvalFuncPtr)&xod::core::analog_input::evaluate,
        (EvalFuncPtr)&xod::core::constant_number::evaluate,
        (EvalFuncPtr)&xod::core::constant_number::evaluate,
        (EvalFuncPtr)&xod::core::constant_logic::evaluate,
        (EvalFuncPtr)&xod::core::constant_number::evaluate,
        (EvalFuncPtr)&xod::core::constant_number::evaluate
    };

    DirtyFlags dirtyFlags[NODE_COUNT] = {
      DirtyFlags(0),
      DirtyFlags(0),
      DirtyFlags(0),
      DirtyFlags(0),
      DirtyFlags(-1),
      DirtyFlags(-1),
      DirtyFlags(-1),
      DirtyFlags(-1),
      DirtyFlags(-1)
    };

    NodeId topology[NODE_COUNT] = {
      4, 5, 6, 7, 8, 1, 3, 0, 2
    };

    TimeMs schedule[NODE_COUNT] = { 0 };
}
