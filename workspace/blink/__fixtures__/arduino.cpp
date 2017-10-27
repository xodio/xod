// The sketch is auto-generated with XOD (https://xod.io).
//
// You can compile and upload it to an Arduino-compatible board with
// Arduino IDE.
//
// Rough code overview:
//
// - Configuration section
// - STL shim
// - Immutable list classes and functions
// - XOD runtime environment
// - Native node implementation
// - Program graph definition
//
// Search for comments fenced with '====' and '----' to navigate through
// the major code blocks.

#include <Arduino.h>
#include <inttypes.h>
#include <avr/pgmspace.h>


/*=============================================================================
 *
 *
 * Configuration
 *
 *
 =============================================================================*/

#define NODE_COUNT          6
#define DEFER_NODE_COUNT    0
#define MAX_OUTPUT_COUNT    1

// Uncomment to turn on debug of the program
//#define XOD_DEBUG

// Uncomment to trace the program runtime in the Serial Monitor
//#define XOD_DEBUG_ENABLE_TRACE

/*=============================================================================
 *
 *
 * STL shim. Provides implementation for vital std::* constructs
 *
 *
 =============================================================================*/

namespace std {

template< class T > struct remove_reference      {typedef T type;};
template< class T > struct remove_reference<T&>  {typedef T type;};
template< class T > struct remove_reference<T&&> {typedef T type;};

template <class T>
typename remove_reference<T>::type&& move(T&& a) {
    return static_cast<typename remove_reference<T>::type&&>(a);
}

} // namespace std

/*=============================================================================
 *
 *
 * XOD-specific list/array implementations
 *
 *
 =============================================================================*/

#ifndef XOD_LIST_H
#define XOD_LIST_H

namespace xod {
namespace detail {

/*
 * Cursors are used internaly by iterators and list views. They are not exposed
 * directly to a list consumer.
 *
 * The base `Cursor` is an interface which provides the bare minimum of methods
 * to facilitate a single iteration pass.
 */
template<typename T> class Cursor {
  public:
    virtual ~Cursor() { }
    virtual bool isValid() const = 0;
    virtual bool value(T* out) const = 0;
    virtual void next() = 0;
};

template<typename T> class NilCursor : public Cursor<T> {
  public:
    virtual bool isValid() const { return false; }
    virtual bool value(T* out) const { return false; }
    virtual void next() { }
};

} // namespace detail

/*
 * Iterator is an object used to iterate a list once.
 *
 * Users create new iterators by calling `someList.iterate()`.
 * Iterators are created on stack and are supposed to have a
 * short live, e.g. for a duration of `for` loop or node’s
 * `evaluate` function. Iterators can’t be copied.
 *
 * Implemented as a pimpl pattern wrapper over the cursor.
 * Once created for a cursor, an iterator owns that cursor
 * and will delete the cursor object once destroyed itself.
 */
template<typename T>
class Iterator {
  public:
    static Iterator<T> nil() {
        return Iterator<T>(new detail::NilCursor<T>());
    }

    Iterator(detail::Cursor<T>* cursor)
        : _cursor(cursor)
    { }

    ~Iterator() {
        if (_cursor)
            delete _cursor;
    }

    Iterator(const Iterator& that) = delete;
    Iterator& operator=(const Iterator& that) = delete;

    Iterator(Iterator&& it)
        : _cursor(it._cursor)
    {
        it._cursor = nullptr;
    }

    Iterator& operator=(Iterator&& it) {
        auto tmp = it._cursor;
        it._cursor = _cursor;
        _cursor = tmp;
        return *this;
    }

    operator bool() const { return _cursor->isValid(); }

    bool value(T* out) const {
        return _cursor->value(out);
    }

    T operator*() const {
        T out;
        _cursor->value(&out);
        return out;
    }

    Iterator& operator++() {
        _cursor->next();
        return *this;
    }

  private:
    detail::Cursor<T>* _cursor;
};

/*
 * An interface for a list view. A particular list view provides a new
 * kind of iteration over existing data. This way we can use list slices,
 * list concatenations, list rotations, etc without introducing new data
 * buffers. We just change the way already existing data is iterated.
 *
 * ListView is not exposed to a list user directly, it is used internally
 * by the List class. However, deriving a new ListView is necessary if you
 * make a new list/string processing node.
 */
template<typename T> class ListView {
  public:
    virtual Iterator<T> iterate() const = 0;
};

/*
 * The list as it seen by data consumers. Have a single method `iterate`
 * to create a new iterator.
 *
 * Implemented as pimpl pattern wrapper over a list view. Takes pointer
 * to a list view in constructor and expects the view will be alive for
 * the whole life time of the list.
 */
template<typename T> class List {
  public:
    constexpr List()
        : _view(nullptr)
    { }

    List(const ListView<T>* view)
        : _view(view)
    { }

    Iterator<T> iterate() const {
        return _view ? _view->iterate() : Iterator<T>::nil();
    }

    // pre 0.15.0 backward compatibility
    List* operator->() __attribute__ ((deprecated)) { return this; }
    const List* operator->() const __attribute__ ((deprecated)) { return this; }

  private:
    const ListView<T>* _view;
};

/*
 * A list view over an old good plain C array.
 *
 * Expects the array will be alive for the whole life time of the
 * view.
 */
template<typename T> class PlainListView : public ListView<T> {
  public:
    class Cursor : public detail::Cursor<T> {
      public:
        Cursor(const PlainListView* owner)
            : _owner(owner)
            , _idx(0)
        { }

        bool isValid() const override {
            return _idx < _owner->_len;
        }

        bool value(T* out) const override {
            if (!isValid())
                return false;
            *out = _owner->_data[_idx];
            return true;
        }

        void next() override { ++_idx; }

      private:
        const PlainListView* _owner;
        size_t _idx;
    };

  public:
    PlainListView(const T* data, size_t len)
        : _data(data)
        , _len(len)
    { }

    virtual Iterator<T> iterate() const override {
        return Iterator<T>(new Cursor(this));
    }

  private:
    friend class Cursor;
    const T* _data;
    size_t _len;
};

/*
 * A list view over a null-terminated C-String.
 *
 * Expects the char buffer will be alive for the whole life time of the view.
 * You can use string literals as a buffer, since they are persistent for
 * the program execution time.
 */
class CStringView : public ListView<char> {
  public:
    class Cursor : public detail::Cursor<char> {
      public:
        Cursor(const char* str)
            : _ptr(str)
        { }

        bool isValid() const override {
            return (bool)*_ptr;
        }

        bool value(char* out) const override {
            *out = *_ptr;
            return (bool)*_ptr;
        }

        void next() override { ++_ptr; }

      private:
        const char* _ptr;
    };

  public:
    CStringView(const char* str = nullptr)
        : _str(str)
    { }

    CStringView& operator=(const CStringView& rhs) {
        _str = rhs._str;
        return *this;
    }

    virtual Iterator<char> iterate() const override {
        return _str ? Iterator<char>(new Cursor(_str)) : Iterator<char>::nil();
    }

  private:
    friend class Cursor;
    const char* _str;
};

/*
 * A list view over two other lists (Left and Right) which first iterates the
 * left one, and when exhausted, iterates the right one.
 *
 * Expects both Left and Right to be alive for the whole view life time.
 */
template<typename T> class ConcatListView : public ListView<T> {
  public:
    class Cursor : public detail::Cursor<T> {
      public:
        Cursor(Iterator<T>&& left, Iterator<T>&& right)
            : _left(std::move(left))
            , _right(std::move(right))
        { }

        bool isValid() const override {
            return _left || _right;
        }

        bool value(T* out) const override {
            return _left.value(out) || _right.value(out);
        }

        void next() override {
            _left ? ++_left : ++_right;
        }

      private:
        Iterator<T> _left;
        Iterator<T> _right;
    };

  public:
    ConcatListView() { }

    ConcatListView(List<T> left, List<T> right)
        : _left(left)
        , _right(right)
    { }

    ConcatListView& operator=(const ConcatListView& rhs) {
        _left = rhs._left;
        _right = rhs._right;
        return *this;
    }

    virtual Iterator<T> iterate() const override {
        return Iterator<T>(new Cursor(_left.iterate(), _right.iterate()));
    }

  private:
    friend class Cursor;
    const List<T> _left;
    const List<T> _right;
};

//----------------------------------------------------------------------------
// Text string helpers
//----------------------------------------------------------------------------

using XString = List<char>;

/*
 * List and list view in a single pack. An utility used to define constant
 * string literals in XOD.
 */
class XStringCString : public XString {
  public:
    XStringCString(const char* str)
        : XString(&_view)
        , _view(str)
    { }

  private:
    CStringView _view;
};

} // namespace xod

#endif

/*=============================================================================
 *
 *
 * Basic algorithms for XOD lists
 *
 *
 =============================================================================*/

#ifndef XOD_LIST_FUNCS_H
#define XOD_LIST_FUNCS_H



namespace xod {

/*
 * Folds a list from left. Also known as "reduce".
 */
template<typename T, typename TR>
TR foldl(List<T> xs, TR (*func)(TR, T), TR acc) {
    for (auto it = xs.iterate(); it; ++it)
        acc = func(acc, *it);
    return acc;
}

template<typename T> size_t lengthReducer(size_t len, T) {
    return len + 1;
}

/*
 * Computes length of a list.
 */
template<typename T> size_t length(List<T> xs) {
    return foldl(xs, lengthReducer<T>, (size_t)0);
}

template<typename T> T* dumpReducer(T* buff, T x) {
    *buff = x;
    return buff + 1;
}

/*
 * Copies a list content into a memory buffer.
 *
 * It is expected that `outBuff` has enough size to fit all the data.
 */
template<typename T> size_t dump(List<T> xs, T* outBuff) {
    T* buffEnd = foldl(xs, dumpReducer, outBuff);
    return buffEnd - outBuff;
}

} // namespace xod

#endif


/*=============================================================================
 *
 *
 * Runtime
 *
 *
 =============================================================================*/

//----------------------------------------------------------------------------
// Debug routines
//----------------------------------------------------------------------------
#ifndef DEBUG_SERIAL
#  define DEBUG_SERIAL Serial
#endif

#if defined(XOD_DEBUG) && defined(XOD_DEBUG_ENABLE_TRACE)
#  define XOD_TRACE(x)      { DEBUG_SERIAL.print(x); DEBUG_SERIAL.flush(); }
#  define XOD_TRACE_LN(x)   { DEBUG_SERIAL.println(x); DEBUG_SERIAL.flush(); }
#  define XOD_TRACE_F(x)    XOD_TRACE(F(x))
#  define XOD_TRACE_FLN(x)  XOD_TRACE_LN(F(x))
#else
#  define XOD_TRACE(x)
#  define XOD_TRACE_LN(x)
#  define XOD_TRACE_F(x)
#  define XOD_TRACE_FLN(x)
#endif

//----------------------------------------------------------------------------
// PGM space utilities
//----------------------------------------------------------------------------
#define pgm_read_nodeid(address) (pgm_read_word(address))

/*
 * Workaround for bugs:
 * https://github.com/arduino/ArduinoCore-sam/pull/43
 * https://github.com/arduino/ArduinoCore-samd/pull/253
 * Remove after the PRs merge
 */
#if !defined(ARDUINO_ARCH_AVR) && defined(pgm_read_ptr)
#  undef pgm_read_ptr
#  define pgm_read_ptr(addr) (*(const void **)(addr))
#endif

//----------------------------------------------------------------------------
// Compatibilities
//----------------------------------------------------------------------------

#if !defined(ARDUINO_ARCH_AVR)
/*
 * Provide dtostrf function for non-AVR platforms. Although many platforms
 * provide a stub many others do not. And the stub is based on `sprintf`
 * which doesn’t work with floating point formatters on some platforms
 * (e.g. Arduino M0).
 *
 * This is an implementation based on `fcvt` standard function. Taken here:
 * https://forum.arduino.cc/index.php?topic=368720.msg2542614#msg2542614
 */
char *dtostrf(double val, int width, unsigned int prec, char *sout) {
    int decpt, sign, reqd, pad;
    const char *s, *e;
    char *p;
    s = fcvt(val, prec, &decpt, &sign);
    if (prec == 0 && decpt == 0) {
        s = (*s < '5') ? "0" : "1";
        reqd = 1;
    } else {
        reqd = strlen(s);
        if (reqd > decpt) reqd++;
        if (decpt == 0) reqd++;
    }
    if (sign) reqd++;
    p = sout;
    e = p + reqd;
    pad = width - reqd;
    if (pad > 0) {
        e += pad;
        while (pad-- > 0) *p++ = ' ';
    }
    if (sign) *p++ = '-';
    if (decpt <= 0 && prec > 0) {
        *p++ = '0';
        *p++ = '.';
        e++;
        while ( decpt < 0 ) {
            decpt++;
            *p++ = '0';
        }
    }
    while (p < e) {
        *p++ = *s++;
        if (p == e) break;
        if (--decpt == 0) *p++ = '.';
    }
    if (width < 0) {
        pad = (reqd + width) * -1;
        while (pad-- > 0) *p++ = ' ';
    }
    *p = 0;
    return sout;
}
#endif


namespace xod {
//----------------------------------------------------------------------------
// Type definitions
//----------------------------------------------------------------------------
#define NO_NODE                 ((NodeId)-1)

typedef double Number;
typedef bool Logic;

#if NODE_COUNT < 256
typedef uint8_t NodeId;
#elif NODE_COUNT < 65536
typedef uint16_t NodeId;
#else
typedef uint32_t NodeId;
#endif

/*
 * Context is a handle passed to each node `evaluate` function. Currently, it’s
 * alias for NodeId but likely will be changed in future to support list
 * lifting and other features
 */
typedef NodeId Context;

/*
 * LSB of a dirty flag shows whether a particular node is dirty or not
 * Other bits shows dirtieness of its particular outputs:
 * - 1-st bit for 0-th output
 * - 2-nd bit for 1-st output
 * - etc
 *
 * An outcome limitation is that a native node must not have more than 7 output
 * pins.
 */
typedef uint8_t DirtyFlags;

typedef unsigned long TimeMs;
typedef void (*EvalFuncPtr)(Context ctx);

/*
 * Each input stores a reference to its upstream node so that we can get values
 * on input pins. Having a direct pointer to the value is not enough because we
 * want to know dirty’ness as well. So we have to use this structure instead of
 * a pointer.
 */
struct UpstreamPinRef {
    // Upstream node ID
    NodeId nodeId;
    // Index of the upstream node’s output.
    // Use 3 bits as it just enough to store values 0..7
    uint16_t pinIndex : 3;
    // Byte offset in a storage of the upstream node where the actual pin value
    // is stored
    uint16_t storageOffset : 13;
};

/*
 * Input descriptor is a metaprogramming structure used to enforce an
 * input’s type and store its wiring data location as a zero-RAM constant.
 *
 * A specialized descriptor is required by `getValue` function. Every
 * input of every type node gets its own descriptor in generated code that
 * can be accessed as input_FOO. Where FOO is a pin identifier.
 */
template<typename ValueT_, size_t wiringOffset>
struct InputDescriptor {
    typedef ValueT_ ValueT;
    enum {
        WIRING_OFFSET = wiringOffset
    };
};

/*
 * Output descriptor serve the same purpose as InputDescriptor but for
 * outputs.
 *
 * In addition to wiring data location it keeps storage data location (where
 * actual value is stored) and own zero-based index among outputs of a particular
 * node
 */
template<typename ValueT_, size_t wiringOffset, size_t storageOffset, uint8_t index>
struct OutputDescriptor {
    typedef ValueT_ ValueT;
    enum {
        WIRING_OFFSET = wiringOffset,
        STORAGE_OFFSET = storageOffset,
        INDEX = index
    };
};

//----------------------------------------------------------------------------
// Forward declarations
//----------------------------------------------------------------------------
extern void* const g_storages[NODE_COUNT];
extern const void* const g_wiring[NODE_COUNT];
extern DirtyFlags g_dirtyFlags[NODE_COUNT];

// TODO: replace with a compact list
extern TimeMs g_schedule[NODE_COUNT];

void clearTimeout(NodeId nid);
bool isTimedOut(NodeId nid);

//----------------------------------------------------------------------------
// Engine (private API)
//----------------------------------------------------------------------------

TimeMs g_transactionTime;

void* getStoragePtr(NodeId nid, size_t offset) {
    return (uint8_t*)pgm_read_ptr(&g_storages[nid]) + offset;
}

template<typename T>
T getStorageValue(NodeId nid, size_t offset) {
    return *reinterpret_cast<T*>(getStoragePtr(nid, offset));
}

void* getWiringPgmPtr(NodeId nid, size_t offset) {
    return (uint8_t*)pgm_read_ptr(&g_wiring[nid]) + offset;
}

template<typename T>
T getWiringValue(NodeId nid, size_t offset) {
    T result;
    memcpy_P(&result, getWiringPgmPtr(nid, offset), sizeof(T));
    return result;
}

bool isOutputDirty(NodeId nid, uint8_t index) {
    return g_dirtyFlags[nid] & (1 << (index + 1));
}

bool isInputDirtyImpl(NodeId nid, size_t wiringOffset) {
    UpstreamPinRef ref = getWiringValue<UpstreamPinRef>(nid, wiringOffset);
    if (ref.nodeId == NO_NODE)
        return false;

    return isOutputDirty(ref.nodeId, ref.pinIndex);
}

template<typename InputT>
bool isInputDirty(NodeId nid) {
    return isInputDirtyImpl(nid, InputT::WIRING_OFFSET);
}

void markPinDirty(NodeId nid, uint8_t index) {
    g_dirtyFlags[nid] |= 1 << (index + 1);
}

void markNodeDirty(NodeId nid) {
    g_dirtyFlags[nid] |= 0x1;
}

bool isNodeDirty(NodeId nid) {
    return g_dirtyFlags[nid] & 0x1;
}

template<typename T>
T getOutputValueImpl(NodeId nid, size_t storageOffset) {
    return getStorageValue<T>(nid, storageOffset);
}

template<typename T>
T getInputValueImpl(NodeId nid, size_t wiringOffset) {
    UpstreamPinRef ref = getWiringValue<UpstreamPinRef>(nid, wiringOffset);
    if (ref.nodeId == NO_NODE)
        return (T)0;

    return getOutputValueImpl<T>(ref.nodeId, ref.storageOffset);
}

template<typename T>
struct always_false {
    enum { value = 0 };
};

// GetValue -- classical trick for partial function (API `xod::getValue`)
// template specialization
template<typename InputOutputT>
struct GetValue {
    static typename InputOutputT::ValueT getValue(Context ctx) {
        static_assert(
                always_false<InputOutputT>::value,
                "You should provide an input_XXX or output_YYY argument " \
                "in angle brackets of getValue"
                );

    }
};

template<typename ValueT, size_t wiringOffset>
struct GetValue<InputDescriptor<ValueT, wiringOffset>> {
    static ValueT getValue(Context ctx) {
        return getInputValueImpl<ValueT>(ctx, wiringOffset);
    }
};

template<typename ValueT, size_t wiringOffset, size_t storageOffset, uint8_t index>
struct GetValue<OutputDescriptor<ValueT, wiringOffset, storageOffset, index>> {
    static ValueT getValue(Context ctx) {
        return getOutputValueImpl<ValueT>(ctx, storageOffset);
    }
};

template<typename T>
void emitValueImpl(
        NodeId nid,
        size_t storageOffset,
        size_t wiringOffset,
        uint8_t index,
        T value) {

    // Store new value and make the node itself dirty
    T* storedValue = reinterpret_cast<T*>(getStoragePtr(nid, storageOffset));
    *storedValue = value;
    markPinDirty(nid, index);

    // Notify downstream nodes about changes
    // NB: linked nodes array is in PGM space
    const NodeId* pDownstreamNid = getWiringValue<const NodeId*>(nid, wiringOffset);
    NodeId downstreamNid = pgm_read_nodeid(pDownstreamNid);

    while (downstreamNid != NO_NODE) {
        markNodeDirty(downstreamNid);
        downstreamNid = pgm_read_nodeid(pDownstreamNid++);
    }
}

void evaluateNode(NodeId nid) {
    XOD_TRACE_F("eval #");
    XOD_TRACE_LN(nid);
    EvalFuncPtr eval = getWiringValue<EvalFuncPtr>(nid, 0);
    eval(nid);
}

void runTransaction() {
    g_transactionTime = millis();

    XOD_TRACE_F("Transaction started, t=");
    XOD_TRACE_LN(g_transactionTime);

    // defer-* nodes are always at the very bottom of the graph,
    // so no one will recieve values emitted by them.
    // We must evaluate them before everybody else
    // to give them a chance to emit values.
    for (NodeId nid = NODE_COUNT - DEFER_NODE_COUNT; nid < NODE_COUNT; ++nid) {
        if (isTimedOut(nid)) {
            evaluateNode(nid);
            // Clear node dirty flag, so it will evaluate
            // on "regular" pass only if it has a dirty input.
            // We must save dirty output flags,
            // or 'isInputDirty' will not work correctly in "downstream" nodes.
            g_dirtyFlags[nid] &= ~0x1;
            clearTimeout(nid);
        }
    }

    for (NodeId nid = 0; nid < NODE_COUNT; ++nid) {
        if (isNodeDirty(nid)) {
            evaluateNode(nid);

            // If the schedule is stale, clear timeout so that
            // the node would not be marked dirty again in idle
            if (isTimedOut(nid))
                clearTimeout(nid);
        }
    }

    // Clear dirtieness for all nodes and pins
    memset(g_dirtyFlags, 0, sizeof(g_dirtyFlags));

    XOD_TRACE_F("Transaction completed, t=");
    XOD_TRACE_LN(millis());
}

void idle() {
    // Mark timed out nodes dirty. Do not reset schedule here to give
    // a chance for a node to get a reasonable result from `isTimedOut`
    TimeMs now = millis();
    for (NodeId nid = 0; nid < NODE_COUNT; ++nid) {
        TimeMs t = g_schedule[nid];
        if (t && t < now)
            markNodeDirty(nid);
    }
}

//----------------------------------------------------------------------------
// Public API (can be used by native nodes’ `evaluate` functions)
//----------------------------------------------------------------------------

template<typename InputOutputT>
typename InputOutputT::ValueT getValue(Context ctx) {
    return GetValue<InputOutputT>::getValue(ctx);
}

template<typename OutputT>
void emitValue(NodeId nid, typename OutputT::ValueT value) {
    emitValueImpl(
            nid,
            OutputT::STORAGE_OFFSET,
            OutputT::WIRING_OFFSET,
            OutputT::INDEX,
            value);
}

TimeMs transactionTime() {
    return g_transactionTime;
}

void setTimeout(NodeId nid, TimeMs timeout) {
    g_schedule[nid] = transactionTime() + timeout;
}

void clearTimeout(NodeId nid) {
    g_schedule[nid] = 0;
}

bool isTimedOut(NodeId nid) {
    return g_schedule[nid] && g_schedule[nid] < transactionTime();
}

} // namespace xod

//----------------------------------------------------------------------------
// Entry point
//----------------------------------------------------------------------------
void setup() {
    // FIXME: looks like there is a rounding bug. Waiting for 100ms fights it
    delay(100);
#ifdef XOD_DEBUG
    DEBUG_SERIAL.begin(115200);
#endif
    XOD_TRACE_FLN("\n\nProgram started");
}

void loop() {
    xod::idle();
    xod::runTransaction();
}

/*=============================================================================
 *
 *
 * Native node implementations
 *
 *
 =============================================================================*/

namespace xod {

//-----------------------------------------------------------------------------
// xod/core/clock implementation
//-----------------------------------------------------------------------------
namespace xod__core__clock {

struct State {
  TimeMs nextTrig;
};

struct Storage {
    State state;
    Logic output_TICK;
};

struct Wiring {
    EvalFuncPtr eval;
    UpstreamPinRef input_EN;
    UpstreamPinRef input_IVAL;
    UpstreamPinRef input_RST;
    const NodeId* output_TICK;
};

State* getState(NodeId nid) {
    return reinterpret_cast<State*>(getStoragePtr(nid, 0));
}

using input_EN = InputDescriptor<Logic, offsetof(Wiring, input_EN)>;
using input_IVAL = InputDescriptor<Number, offsetof(Wiring, input_IVAL)>;
using input_RST = InputDescriptor<Logic, offsetof(Wiring, input_RST)>;

using output_TICK = OutputDescriptor<Logic, offsetof(Wiring, output_TICK), offsetof(Storage, output_TICK), 0>;

void evaluate(Context ctx) {
    State* state = getState(ctx);
    TimeMs tNow = transactionTime();
    TimeMs dt = getValue<input_IVAL>(ctx) * 1000;
    TimeMs tNext = tNow + dt;

    if (isInputDirty<input_RST>(ctx) || isInputDirty<input_EN>(ctx)) {
        // Handle enable/disable/reset
        if (dt <= 0 || !getValue<input_EN>(ctx)) {
            // Disable timeout loop on zero IVAL or explicit false on EN
            state->nextTrig = 0;
            clearTimeout(ctx);
        } else if (state->nextTrig < tNow || state->nextTrig > tNext) {
            // Start timeout from scratch
            state->nextTrig = tNext;
            setTimeout(ctx, dt);
        }
    }

    if (isTimedOut(ctx)) {
        emitValue<output_TICK>(ctx, 1);
        state->nextTrig = tNext;
        setTimeout(ctx, dt);
    }
}

} // namespace xod__core__clock

//-----------------------------------------------------------------------------
// xod/core/digital_output implementation
//-----------------------------------------------------------------------------
namespace xod__core__digital_output {

struct State {
    int configuredPort = -1;
};

struct Storage {
    State state;
};

struct Wiring {
    EvalFuncPtr eval;
    UpstreamPinRef input_PORT;
    UpstreamPinRef input_SIG;
};

State* getState(NodeId nid) {
    return reinterpret_cast<State*>(getStoragePtr(nid, 0));
}

using input_PORT = InputDescriptor<Number, offsetof(Wiring, input_PORT)>;
using input_SIG = InputDescriptor<Logic, offsetof(Wiring, input_SIG)>;

void evaluate(Context ctx) {
    State* state = getState(ctx);
    const int port = (int)getValue<input_PORT>(ctx);
    if (port != state->configuredPort) {
        ::pinMode(port, OUTPUT);
        // Store configured port so to avoid repeating `pinMode` call if just
        // SIG is updated
        state->configuredPort = port;
    }

    const bool val = getValue<input_SIG>(ctx);
    ::digitalWrite(port, val);
}

} // namespace xod__core__digital_output

//-----------------------------------------------------------------------------
// xod/core/flip_flop implementation
//-----------------------------------------------------------------------------
namespace xod__core__flip_flop {

struct State {
};

struct Storage {
    State state;
    Logic output_MEM;
};

struct Wiring {
    EvalFuncPtr eval;
    UpstreamPinRef input_SET;
    UpstreamPinRef input_TGL;
    UpstreamPinRef input_RST;
    const NodeId* output_MEM;
};

State* getState(NodeId nid) {
    return reinterpret_cast<State*>(getStoragePtr(nid, 0));
}

using input_SET = InputDescriptor<Logic, offsetof(Wiring, input_SET)>;
using input_TGL = InputDescriptor<Logic, offsetof(Wiring, input_TGL)>;
using input_RST = InputDescriptor<Logic, offsetof(Wiring, input_RST)>;

using output_MEM = OutputDescriptor<Logic, offsetof(Wiring, output_MEM), offsetof(Storage, output_MEM), 0>;

void evaluate(Context ctx) {
    bool oldState = getValue<output_MEM>(ctx);
    bool newState = oldState;

    if (isInputDirty<input_TGL>(ctx)) {
        newState = !oldState;
    } else if (isInputDirty<input_SET>(ctx)) {
        newState = true;
    } else {
        newState = false;
    }

    if (newState == oldState)
        return;

    emitValue<output_MEM>(ctx, newState);
}

} // namespace xod__core__flip_flop

//-----------------------------------------------------------------------------
// xod/core/constant_boolean implementation
//-----------------------------------------------------------------------------
namespace xod__core__constant_boolean {

struct State {
};

struct Storage {
    State state;
    Logic output_VAL;
};

struct Wiring {
    EvalFuncPtr eval;
    const NodeId* output_VAL;
};

State* getState(NodeId nid) {
    return reinterpret_cast<State*>(getStoragePtr(nid, 0));
}

using output_VAL = OutputDescriptor<Logic, offsetof(Wiring, output_VAL), offsetof(Storage, output_VAL), 0>;

void evaluate(Context ctx) {
}

} // namespace xod__core__constant_boolean

//-----------------------------------------------------------------------------
// xod/core/constant_number implementation
//-----------------------------------------------------------------------------
namespace xod__core__constant_number {

struct State {};

struct Storage {
    State state;
    Number output_VAL;
};

struct Wiring {
    EvalFuncPtr eval;
    const NodeId* output_VAL;
};

State* getState(NodeId nid) {
    return reinterpret_cast<State*>(getStoragePtr(nid, 0));
}

using output_VAL = OutputDescriptor<Number, offsetof(Wiring, output_VAL), offsetof(Storage, output_VAL), 0>;

void evaluate(Context ctx) {
}

} // namespace xod__core__constant_number

} // namespace xod

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

    // Storage of #0 xod/core/constant_number
    constexpr Number node_0_output_VAL = 0.25;
    xod__core__constant_number::Storage storage_0 = {
        { }, // state
        node_0_output_VAL

    };

    // Storage of #1 xod/core/constant_boolean
    constexpr Logic node_1_output_VAL = true;
    xod__core__constant_boolean::Storage storage_1 = {
        { }, // state
        node_1_output_VAL

    };

    // Storage of #2 xod/core/constant_number
    constexpr Number node_2_output_VAL = 13;
    xod__core__constant_number::Storage storage_2 = {
        { }, // state
        node_2_output_VAL

    };

    // Storage of #3 xod/core/clock
    constexpr Logic node_3_output_TICK = false;
    xod__core__clock::Storage storage_3 = {
        { }, // state
        node_3_output_TICK

    };

    // Storage of #4 xod/core/flip_flop
    constexpr Logic node_4_output_MEM = false;
    xod__core__flip_flop::Storage storage_4 = {
        { }, // state
        node_4_output_MEM

    };

    // Storage of #5 xod/core/digital_output

    xod__core__digital_output::Storage storage_5 = {
        { }, // state
    };

    DirtyFlags g_dirtyFlags[NODE_COUNT] = {
        DirtyFlags(255),
        DirtyFlags(255),
        DirtyFlags(255),
        DirtyFlags(253),
        DirtyFlags(255),
        DirtyFlags(255)
    };

    TimeMs g_schedule[NODE_COUNT] = { 0 };

    //-------------------------------------------------------------------------
    // Static (immutable) data
    //-------------------------------------------------------------------------

    // Wiring of #0 xod/core/constant_number
    const NodeId outLinks_0_VAL[] PROGMEM = { 3, NO_NODE };
    const xod__core__constant_number::Wiring wiring_0 PROGMEM = {
        &xod__core__constant_number::evaluate,
        // inputs (UpstreamPinRef’s initializers)
        // outputs (NodeId list binding)
        outLinks_0_VAL // output_VAL
    };

    // Wiring of #1 xod/core/constant_boolean
    const NodeId outLinks_1_VAL[] PROGMEM = { 3, NO_NODE };
    const xod__core__constant_boolean::Wiring wiring_1 PROGMEM = {
        &xod__core__constant_boolean::evaluate,
        // inputs (UpstreamPinRef’s initializers)
        // outputs (NodeId list binding)
        outLinks_1_VAL // output_VAL
    };

    // Wiring of #2 xod/core/constant_number
    const NodeId outLinks_2_VAL[] PROGMEM = { 5, NO_NODE };
    const xod__core__constant_number::Wiring wiring_2 PROGMEM = {
        &xod__core__constant_number::evaluate,
        // inputs (UpstreamPinRef’s initializers)
        // outputs (NodeId list binding)
        outLinks_2_VAL // output_VAL
    };

    // Wiring of #3 xod/core/clock
    const NodeId outLinks_3_TICK[] PROGMEM = { 4, NO_NODE };
    const xod__core__clock::Wiring wiring_3 PROGMEM = {
        &xod__core__clock::evaluate,
        // inputs (UpstreamPinRef’s initializers)
        { NodeId(1),
            xod__core__constant_boolean::output_VAL::INDEX,
            xod__core__constant_boolean::output_VAL::STORAGE_OFFSET }, // input_EN
        { NodeId(0),
            xod__core__constant_number::output_VAL::INDEX,
            xod__core__constant_number::output_VAL::STORAGE_OFFSET }, // input_IVAL
        { NO_NODE, 0, 0 }, // input_RST
        // outputs (NodeId list binding)
        outLinks_3_TICK // output_TICK
    };

    // Wiring of #4 xod/core/flip_flop
    const NodeId outLinks_4_MEM[] PROGMEM = { 5, NO_NODE };
    const xod__core__flip_flop::Wiring wiring_4 PROGMEM = {
        &xod__core__flip_flop::evaluate,
        // inputs (UpstreamPinRef’s initializers)
        { NO_NODE, 0, 0 }, // input_SET
        { NodeId(3),
            xod__core__clock::output_TICK::INDEX,
            xod__core__clock::output_TICK::STORAGE_OFFSET }, // input_TGL
        { NO_NODE, 0, 0 }, // input_RST
        // outputs (NodeId list binding)
        outLinks_4_MEM // output_MEM
    };

    // Wiring of #5 xod/core/digital_output
    const xod__core__digital_output::Wiring wiring_5 PROGMEM = {
        &xod__core__digital_output::evaluate,
        // inputs (UpstreamPinRef’s initializers)
        { NodeId(2),
            xod__core__constant_number::output_VAL::INDEX,
            xod__core__constant_number::output_VAL::STORAGE_OFFSET }, // input_PORT
        { NodeId(4),
            xod__core__flip_flop::output_MEM::INDEX,
            xod__core__flip_flop::output_MEM::STORAGE_OFFSET }, // input_SIG
        // outputs (NodeId list binding)
    };

    // PGM array with pointers to PGM wiring information structs
    const void* const g_wiring[NODE_COUNT] PROGMEM = {
        &wiring_0,
        &wiring_1,
        &wiring_2,
        &wiring_3,
        &wiring_4,
        &wiring_5
    };

    // PGM array with pointers to RAM-located storages
    void* const g_storages[NODE_COUNT] PROGMEM = {
        &storage_0,
        &storage_1,
        &storage_2,
        &storage_3,
        &storage_4,
        &storage_5
    };
}
