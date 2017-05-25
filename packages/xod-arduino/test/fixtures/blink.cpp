
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

    // TODO: optimize, we should choose uint8_t if there are less than 255 nodes in total
    // and uint32_t if there are more than 65535
    typedef uint16_t NodeId;

    /*
     * PinKey is an address value used to find input’s or output’s data within
     * node’s Storage.
     *
     * For inputs its value is simply an offset in bytes from the beginning of
     * Storage structure instance. There will be a PinRef pointing to an upstream
     * output at this address.
     *
     * For outputs the pin key consists of two parts ORed bitwise. Least
     * significant bits (count defined by `PIN_KEY_OFFSET_BITS`) define an offset
     * from the beginning of node’s Storage where output data could be found. It
     * would be an OutputPin structure. Most significant bits define an index
     * number of that output among all outputs of the node. The index is used to
     * work with dirty flags bit-value.
     */
    // TODO: optimize, we should choose a proper type with a minimal enough capacity
    typedef uint16_t PinKey;

    // TODO: optimize, we should choose a proper type with a minimal enough capacity
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

    // TODO: replace with a compact list
    extern TimeMs schedule[NODE_COUNT];

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

    /*
     * Input descriptor is a metaprogramming structure used to enforce an
     * input’s type and store its PinKey as a zero-memory constant.
     *
     * A specialized descriptor is required by `getValue` function. Every
     * input of every type node gets its own descriptor in generated code that
     * can be accessed as Inputs::FOO. Where FOO is a pin identifier.
     */
    template<typename ValueT_, size_t offsetInStorage>
    struct InputDescriptor {
        typedef ValueT_ ValueT;
        enum Offset : PinKey {
            KEY = offsetInStorage
        };
    };

    /*
     * Output descriptor serve the same purpose as InputDescriptor but for
     * ouputs.
     */
    template<typename ValueT_, size_t offsetInStorage, int index>
    struct OutputDescriptor {
        typedef ValueT_ ValueT;
        enum Offset : PinKey {
            KEY = offsetInStorage | (index << PIN_KEY_OFFSET_BITS)
        };
    };

    void* pinPtr(void* storage, PinKey key) {
        const size_t offset = key & ~(PinKey(-1) << PIN_KEY_OFFSET_BITS);
        return (uint8_t*)storage + offset;
    }

    DirtyFlags dirtyPinBit(PinKey key) {
        const PinKey nbit = (key >> PIN_KEY_OFFSET_BITS) + 1;
        return 1 << nbit;
    }

    bool isOutputDirty(NodeId nid, PinKey key) {
        return dirtyFlags[nid] & dirtyPinBit(key);
    }

    bool isInputDirtyImpl(NodeId nid, PinKey key) {
        PinRef* ref = (PinRef*)pinPtr(storages[nid], key);
        if (ref->nodeId == NO_NODE)
            return false;

        return isOutputDirty(ref->nodeId, ref->pinKey);
    }

    template<typename InputT>
    bool isInputDirty(NodeId nid) {
        return isInputDirtyImpl(nid, InputT::KEY);
    }

    void markPinDirty(NodeId nid, PinKey key) {
        dirtyFlags[nid] |= dirtyPinBit(key);
    }

    void markNodeDirty(NodeId nid) {
        dirtyFlags[nid] |= 0x1;
    }

    bool isNodeDirty(NodeId nid) {
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
    T getValueImpl(NodeId nid, PinKey key) {
        PinRef* ref = (PinRef*)pinPtr(storages[nid], key);
        if (ref->nodeId == NO_NODE)
            return (T)0;

        return *(T*)pinPtr(storages[ref->nodeId], ref->pinKey);
    }

    template<typename InputT>
    typename InputT::ValueT getValue(NodeId nid) {
        return getValueImpl<typename InputT::ValueT>(nid, InputT::KEY);
    }

    template<typename T>
    void emitValueImpl(NodeId nid, PinKey key, T value) {
        OutputPin<T>* outputPin = (OutputPin<T>*)pinPtr(storages[nid], key);

        outputPin->value = value;
        markPinDirty(nid, key);

        NodeId* linkedNode = outputPin->links;
        while (*linkedNode != NO_NODE) {
            markNodeDirty(*linkedNode++);
        }
    }

    template<typename OutputT>
    void emitValue(NodeId nid, typename OutputT::ValueT value) {
        emitValueImpl(nid, OutputT::KEY, value);
    }

    template<typename T>
    void reemitValueImpl(NodeId nid, PinKey key) {
        OutputPin<T>* outputPin = (OutputPin<T>*)pinPtr(storages[nid], key);
        emitValueImpl<T>(nid, key, outputPin->value);
    }

    template<typename OutputT>
    void reemitValue(NodeId nid) {
        reemitValueImpl<typename OutputT::ValueT>(nid, OutputT::KEY);
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
    PinRef input_VAL;
    PinRef input_PORT;
};

namespace Inputs {
    using VAL = InputDescriptor<Logic, offsetof(Storage, input_VAL)>;
    using PORT = InputDescriptor<Number, offsetof(Storage, input_PORT)>;
}

namespace Outputs {
}

void evaluate(NodeId nid, State* state) {
    const int pin = (int)getNumber(nid, Inputs::PORT);
    const bool val = getLogic(nid, Inputs::VAL);

    if (isInputDirty(nid, Inputs::PORT)) {
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
    PinRef input_IN_0;
    PinRef input_IN_1;
    OutputPin<Number> output_OUT;
};

namespace Inputs {
    using IN_0 = InputDescriptor<Number, offsetof(Storage, input_IN_0)>;
    using IN_1 = InputDescriptor<Number, offsetof(Storage, input_IN_1)>;
}

namespace Outputs {
    using OUT = OutputDescriptor<Number, offsetof(Storage, output_OUT), 0>;
}

void evaluate(NodeId nid, State* state) {
    const Number in1 = getNumber(nid, Inputs::IN_0);
    const Number in2 = getNumber(nid, Inputs::IN_1);
    emitNumber(nid, Outputs::OUT, in1 * in2);
}

  }}}
  namespace xod { namespace core { namespace latch {
  struct State {
    bool value;
};

struct Storage {
    State state;
    PinRef input_RST;
    PinRef input_TGL;
    PinRef input_SET;
    OutputPin<Logic> output_OUT;
};

namespace Inputs {
    using RST = InputDescriptor<Logic, offsetof(Storage, input_RST)>;
    using TGL = InputDescriptor<Logic, offsetof(Storage, input_TGL)>;
    using SET = InputDescriptor<Logic, offsetof(Storage, input_SET)>;
}

namespace Outputs {
    using OUT = OutputDescriptor<Logic, offsetof(Storage, output_OUT), 0>;
}

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

namespace Inputs {
    using IVAL = InputDescriptor<Number, offsetof(Storage, input_IVAL)>;
}

namespace Outputs {
    using TICK = OutputDescriptor<Logic, offsetof(Storage, output_TICK), 0>;
}

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
  namespace xod { namespace core { namespace cast_number_to_boolean {
  struct State {
};

struct Storage {
    State state;
    PinRef input_IN;
    OutputPin<Logic> output_OUT;
};

namespace Inputs {
    using IN = InputDescriptor<Number, offsetof(Storage, input_IN)>;
}

namespace Outputs {
    using OUT = OutputDescriptor<Logic, offsetof(Storage, output_OUT), 0>;
}

void evaluate(NodeId nid, State* state) {
    emitLogic(nid, Outputs::OUT, getNumber(nid, Inputs::IN));
}

  }}}
  namespace xod { namespace core { namespace cast_boolean_to_number {
  struct State {
};

struct Storage {
    State state;
    PinRef input_IN;
    OutputPin<Number> output_OUT;
};

namespace Inputs {
    using IN = InputDescriptor<Logic, offsetof(Storage, input_IN)>;
}

namespace Outputs {
    using OUT = OutputDescriptor<Number, offsetof(Storage, output_OUT), 0>;
}

void evaluate(NodeId nid, State* state) {
    emitNumber(nid, Outputs::OUT, getLogic(nid, Inputs::IN));
}

  }}}
  namespace xod { namespace core { namespace constant_number {
  struct State {
};

struct Storage {
    State state;
    OutputPin<Number> output_VAL;
};

namespace Inputs {
}

namespace Outputs {
    using VAL = OutputDescriptor<Number, offsetof(Storage, output_VAL), 0>;
}

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

    NodeId links_0_OUT[] = { 2, NO_NODE };
    xod::math::multiply::Storage storage_0 = {
        { }, // state
        { NodeId(3), xod::core::cast_boolean_to_number::Outputs::OUT }, // input_IN_0
        { NodeId(3), xod::core::cast_boolean_to_number::Outputs::OUT }, // input_IN_1
        { 0, links_0_OUT } // output_OUT
    };

    NodeId links_1_OUT[] = { 3, NO_NODE };
    xod::core::latch::Storage storage_1 = {
        { }, // state
        { NO_NODE, 0 }, // input_RST
        { NodeId(5), xod::core::clock::Outputs::TICK }, // input_TGL
        { NO_NODE, 0 }, // input_SET
        { false, links_1_OUT } // output_OUT
    };

    NodeId links_2_OUT[] = { 4, NO_NODE };
    xod::core::cast_number_to_boolean::Storage storage_2 = {
        { }, // state
        { NodeId(0), xod::math::multiply::Outputs::OUT }, // input_IN
        { false, links_2_OUT } // output_OUT
    };

    NodeId links_3_OUT[] = { 0, NO_NODE };
    xod::core::cast_boolean_to_number::Storage storage_3 = {
        { }, // state
        { NodeId(1), xod::core::latch::Outputs::OUT }, // input_IN
        { 0, links_3_OUT } // output_OUT
    };

    xod::core::digital_output::Storage storage_4 = {
        { }, // state
        { NodeId(2), xod::core::cast_number_to_boolean::Outputs::OUT }, // input_VAL
        { NodeId(6), xod::core::constant_number::Outputs::VAL }, // input_PORT
    };

    NodeId links_5_TICK[] = { 1, NO_NODE };
    xod::core::clock::Storage storage_5 = {
        { }, // state
        { NodeId(7), xod::core::constant_number::Outputs::VAL }, // input_IVAL
        { false, links_5_TICK } // output_TICK
    };

    NodeId links_6_VAL[] = { 4, NO_NODE };
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
        (EvalFuncPtr)&xod::math::multiply::evaluate,
        (EvalFuncPtr)&xod::core::latch::evaluate,
        (EvalFuncPtr)&xod::core::cast_number_to_boolean::evaluate,
        (EvalFuncPtr)&xod::core::cast_boolean_to_number::evaluate,
        (EvalFuncPtr)&xod::core::digital_output::evaluate,
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
      6, 7, 5, 1, 3, 0, 2, 4
    };

    TimeMs schedule[NODE_COUNT] = { 0 };
}
