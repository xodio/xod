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


/*=============================================================================
 *
 *
 * Configuration
 *
 *
 =============================================================================*/

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

namespace xod {
namespace std {

template< class T > struct remove_reference      {typedef T type;};
template< class T > struct remove_reference<T&>  {typedef T type;};
template< class T > struct remove_reference<T&&> {typedef T type;};

template <class T>
typename remove_reference<T>::type&& move(T&& a) {
    return static_cast<typename remove_reference<T>::type&&>(a);
}

} // namespace std
} // namespace xod

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
    virtual bool value(T*) const { return false; }
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

/*
 * Compares two lists.
 */
template<typename T> bool equal(List<T> lhs, List<T> rhs) {
    auto lhsIt = lhs.iterate();
    auto rhsIt = rhs.iterate();

    for (; lhsIt && rhsIt; ++lhsIt, ++rhsIt) {
        if (*lhsIt != *rhsIt) return false;
    }

    return !lhsIt && !rhsIt;
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
#if __SIZEOF_FLOAT__ == 4
typedef float Number;
#else
typedef double Number;
#endif
typedef bool Logic;
typedef unsigned long TimeMs;
typedef uint8_t DirtyFlags;

//----------------------------------------------------------------------------
// Global variables
//----------------------------------------------------------------------------

TimeMs g_transactionTime;
bool g_isSettingUp;

//----------------------------------------------------------------------------
// Metaprogramming utilities
//----------------------------------------------------------------------------

template<typename T> struct always_false {
    enum { value = 0 };
};

//----------------------------------------------------------------------------
// Forward declarations
//----------------------------------------------------------------------------

TimeMs transactionTime();
void runTransaction();

//----------------------------------------------------------------------------
// Engine (private API)
//----------------------------------------------------------------------------

namespace detail {

template<typename NodeT>
bool isTimedOut(const NodeT* node) {
    TimeMs t = node->timeoutAt;
    // TODO: deal with uint32 overflow
    return t && t < transactionTime();
}

// Marks timed out node dirty. Do not reset timeoutAt here to give
// a chance for a node to get a reasonable result from `isTimedOut`
// later during its `evaluate`
template<typename NodeT>
void checkTriggerTimeout(NodeT* node) {
    node->isNodeDirty |= isTimedOut(node);
}

template<typename NodeT>
void clearTimeout(NodeT* node) {
    node->timeoutAt = 0;
}

template<typename NodeT>
void clearStaleTimeout(NodeT* node) {
    if (isTimedOut(node))
        clearTimeout(node);
}

} // namespace detail

//----------------------------------------------------------------------------
// Public API (can be used by native nodes’ `evaluate` functions)
//----------------------------------------------------------------------------

TimeMs transactionTime() {
    return g_transactionTime;
}

bool isSettingUp() {
    return g_isSettingUp;
}

template<typename ContextT>
void setTimeout(ContextT* ctx, TimeMs timeout) {
    ctx->_node->timeoutAt = transactionTime() + timeout;
}

template<typename ContextT>
void clearTimeout(ContextT* ctx) {
    detail::clearTimeout(ctx->_node);
}

template<typename ContextT>
bool isTimedOut(const ContextT* ctx) {
    return detail::isTimedOut(ctx->_node);
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

    xod::g_isSettingUp = true;
    xod::runTransaction();
    xod::g_isSettingUp = false;
}

void loop() {
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
// xod/core/cast-to-pulse(boolean) implementation
//-----------------------------------------------------------------------------
namespace xod__core__cast_to_pulse__boolean {

struct State {
  bool state = false;
};

struct Node {
    State state;
    Logic output_OUT;

    union {
        struct {
            bool isOutputDirty_OUT : 1;
            bool isNodeDirty : 1;
        };

        DirtyFlags dirtyFlags;
    };
};

struct input_IN { };
struct output_OUT { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_IN> { using T = Logic; };
template<> struct ValueType<output_OUT> { using T = Logic; };

struct ContextObject {
    Node* _node;

    Logic _input_IN;

};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_IN" \
            " output_OUT");
}

template<> Logic getValue<input_IN>(Context ctx) {
    return ctx->_input_IN;
}
template<> Logic getValue<output_OUT>(Context ctx) {
    return ctx->_node->output_OUT;
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            "");
    return false;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_OUT");
}

template<> void emitValue<output_OUT>(Context ctx, Logic val) {
    ctx->_node->output_OUT = val;
    ctx->_node->isOutputDirty_OUT = true;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

void evaluate(Context ctx) {
    State* state = getState(ctx);
    auto newValue = getValue<input_IN>(ctx);

    if (newValue == true && state->state == false)
        emitValue<output_OUT>(ctx, 1);

    state->state = newValue;
}

} // namespace xod__core__cast_to_pulse__boolean

//-----------------------------------------------------------------------------
// xod/core/continuously implementation
//-----------------------------------------------------------------------------
namespace xod__core__continuously {

struct State {
};

struct Node {
    State state;
    TimeMs timeoutAt;
    Logic output_TICK;

    union {
        struct {
            bool isOutputDirty_TICK : 1;
            bool isNodeDirty : 1;
        };

        DirtyFlags dirtyFlags;
    };
};

struct output_TICK { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<output_TICK> { using T = Logic; };

struct ContextObject {
    Node* _node;

};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            "" \
            " output_TICK");
}

template<> Logic getValue<output_TICK>(Context ctx) {
    return ctx->_node->output_TICK;
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            "");
    return false;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_TICK");
}

template<> void emitValue<output_TICK>(Context ctx, Logic val) {
    ctx->_node->output_TICK = val;
    ctx->_node->isOutputDirty_TICK = true;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

void evaluate(Context ctx) {
    emitValue<output_TICK>(ctx, 1);
    setTimeout(ctx, 0);
}

} // namespace xod__core__continuously

//-----------------------------------------------------------------------------
// xod/core/clock implementation
//-----------------------------------------------------------------------------
namespace xod__core__clock {

struct State {
  TimeMs nextTrig;
};

struct Node {
    State state;
    TimeMs timeoutAt;
    Logic output_TICK;

    union {
        struct {
            bool isOutputDirty_TICK : 1;
            bool isNodeDirty : 1;
        };

        DirtyFlags dirtyFlags;
    };
};

struct input_EN { };
struct input_IVAL { };
struct input_RST { };
struct output_TICK { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_EN> { using T = Logic; };
template<> struct ValueType<input_IVAL> { using T = Number; };
template<> struct ValueType<input_RST> { using T = Logic; };
template<> struct ValueType<output_TICK> { using T = Logic; };

struct ContextObject {
    Node* _node;

    Logic _input_EN;
    Number _input_IVAL;
    Logic _input_RST;

    bool _isInputDirty_EN;
    bool _isInputDirty_RST;
};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_EN input_IVAL input_RST" \
            " output_TICK");
}

template<> Logic getValue<input_EN>(Context ctx) {
    return ctx->_input_EN;
}
template<> Number getValue<input_IVAL>(Context ctx) {
    return ctx->_input_IVAL;
}
template<> Logic getValue<input_RST>(Context ctx) {
    return ctx->_input_RST;
}
template<> Logic getValue<output_TICK>(Context ctx) {
    return ctx->_node->output_TICK;
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            " input_EN input_RST");
    return false;
}

template<> bool isInputDirty<input_EN>(Context ctx) {
    return ctx->_isInputDirty_EN;
}
template<> bool isInputDirty<input_RST>(Context ctx) {
    return ctx->_isInputDirty_RST;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_TICK");
}

template<> void emitValue<output_TICK>(Context ctx, Logic val) {
    ctx->_node->output_TICK = val;
    ctx->_node->isOutputDirty_TICK = true;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

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
// xod/core/count implementation
//-----------------------------------------------------------------------------
namespace xod__core__count {

struct State {
};

struct Node {
    State state;
    Number output_OUT;

    union {
        struct {
            bool isOutputDirty_OUT : 1;
            bool isNodeDirty : 1;
        };

        DirtyFlags dirtyFlags;
    };
};

struct input_STEP { };
struct input_INC { };
struct input_RST { };
struct output_OUT { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_STEP> { using T = Number; };
template<> struct ValueType<input_INC> { using T = Logic; };
template<> struct ValueType<input_RST> { using T = Logic; };
template<> struct ValueType<output_OUT> { using T = Number; };

struct ContextObject {
    Node* _node;

    Number _input_STEP;
    Logic _input_INC;
    Logic _input_RST;

    bool _isInputDirty_INC;
    bool _isInputDirty_RST;
};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_STEP input_INC input_RST" \
            " output_OUT");
}

template<> Number getValue<input_STEP>(Context ctx) {
    return ctx->_input_STEP;
}
template<> Logic getValue<input_INC>(Context ctx) {
    return ctx->_input_INC;
}
template<> Logic getValue<input_RST>(Context ctx) {
    return ctx->_input_RST;
}
template<> Number getValue<output_OUT>(Context ctx) {
    return ctx->_node->output_OUT;
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            " input_INC input_RST");
    return false;
}

template<> bool isInputDirty<input_INC>(Context ctx) {
    return ctx->_isInputDirty_INC;
}
template<> bool isInputDirty<input_RST>(Context ctx) {
    return ctx->_isInputDirty_RST;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_OUT");
}

template<> void emitValue<output_OUT>(Context ctx, Number val) {
    ctx->_node->output_OUT = val;
    ctx->_node->isOutputDirty_OUT = true;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

void evaluate(Context ctx) {
    Number count = getValue<output_OUT>(ctx);

    if (isInputDirty<input_RST>(ctx))
        count = 0;
    else if (isInputDirty<input_INC>(ctx))
        count += getValue<input_STEP>(ctx);

    emitValue<output_OUT>(ctx, count);
}

} // namespace xod__core__count

//-----------------------------------------------------------------------------
// xod/core/greater implementation
//-----------------------------------------------------------------------------
namespace xod__core__greater {

#pragma XOD dirtieness disable

struct State {
};

struct Node {
    State state;
    Logic output_OUT;

    union {
        struct {
            bool isNodeDirty : 1;
        };

        DirtyFlags dirtyFlags;
    };
};

struct input_IN1 { };
struct input_IN2 { };
struct output_OUT { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_IN1> { using T = Number; };
template<> struct ValueType<input_IN2> { using T = Number; };
template<> struct ValueType<output_OUT> { using T = Logic; };

struct ContextObject {
    Node* _node;

    Number _input_IN1;
    Number _input_IN2;

};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_IN1 input_IN2" \
            " output_OUT");
}

template<> Number getValue<input_IN1>(Context ctx) {
    return ctx->_input_IN1;
}
template<> Number getValue<input_IN2>(Context ctx) {
    return ctx->_input_IN2;
}
template<> Logic getValue<output_OUT>(Context ctx) {
    return ctx->_node->output_OUT;
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            "");
    return false;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_OUT");
}

template<> void emitValue<output_OUT>(Context ctx, Logic val) {
    ctx->_node->output_OUT = val;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

void evaluate(Context ctx) {
    auto lhs = getValue<input_IN1>(ctx);
    auto rhs = getValue<input_IN2>(ctx);
    emitValue<output_OUT>(ctx, lhs > rhs);
}

} // namespace xod__core__greater

//-----------------------------------------------------------------------------
// xod/core/cast-to-string(number) implementation
//-----------------------------------------------------------------------------
namespace xod__core__cast_to_string__number {

#pragma XOD dirtieness disable

struct State {
    char str[16];
    CStringView view;
    State() : view(str) { }
};

struct Node {
    State state;
    XString output_OUT;

    union {
        struct {
            bool isNodeDirty : 1;
        };

        DirtyFlags dirtyFlags;
    };
};

struct input_IN { };
struct output_OUT { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_IN> { using T = Number; };
template<> struct ValueType<output_OUT> { using T = XString; };

struct ContextObject {
    Node* _node;

    Number _input_IN;

};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_IN" \
            " output_OUT");
}

template<> Number getValue<input_IN>(Context ctx) {
    return ctx->_input_IN;
}
template<> XString getValue<output_OUT>(Context ctx) {
    return ctx->_node->output_OUT;
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            "");
    return false;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_OUT");
}

template<> void emitValue<output_OUT>(Context ctx, XString val) {
    ctx->_node->output_OUT = val;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

void evaluate(Context ctx) {
    auto state = getState(ctx);
    auto num = getValue<input_IN>(ctx);
    dtostrf(num, 0, 2, state->str);
    emitValue<output_OUT>(ctx, XString(&state->view));
}

} // namespace xod__core__cast_to_string__number

//-----------------------------------------------------------------------------
// xod/common-hardware/text-lcd-16x2 implementation
//-----------------------------------------------------------------------------
namespace xod__common_hardware__text_lcd_16x2 {

// --- Enter global namespace ---
}}
#include <LiquidCrystal.h>

namespace xod {
namespace xod__common_hardware__text_lcd_16x2 {
// --- Back to local namespace ---
struct State {
    LiquidCrystal* lcd;
};

struct Node {
    State state;
    Logic output_DONE;

    union {
        struct {
            bool isOutputDirty_DONE : 1;
            bool isNodeDirty : 1;
        };

        DirtyFlags dirtyFlags;
    };
};

struct input_RS { };
struct input_EN { };
struct input_D4 { };
struct input_D5 { };
struct input_D6 { };
struct input_D7 { };
struct input_L1 { };
struct input_L2 { };
struct input_UPD { };
struct output_DONE { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_RS> { using T = uint8_t; };
template<> struct ValueType<input_EN> { using T = uint8_t; };
template<> struct ValueType<input_D4> { using T = uint8_t; };
template<> struct ValueType<input_D5> { using T = uint8_t; };
template<> struct ValueType<input_D6> { using T = uint8_t; };
template<> struct ValueType<input_D7> { using T = uint8_t; };
template<> struct ValueType<input_L1> { using T = XString; };
template<> struct ValueType<input_L2> { using T = XString; };
template<> struct ValueType<input_UPD> { using T = Logic; };
template<> struct ValueType<output_DONE> { using T = Logic; };

struct ContextObject {
    Node* _node;

    uint8_t _input_RS;
    uint8_t _input_EN;
    uint8_t _input_D4;
    uint8_t _input_D5;
    uint8_t _input_D6;
    uint8_t _input_D7;
    XString _input_L1;
    XString _input_L2;
    Logic _input_UPD;

    bool _isInputDirty_UPD;
};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_RS input_EN input_D4 input_D5 input_D6 input_D7 input_L1 input_L2 input_UPD" \
            " output_DONE");
}

template<> uint8_t getValue<input_RS>(Context ctx) {
    return ctx->_input_RS;
}
template<> uint8_t getValue<input_EN>(Context ctx) {
    return ctx->_input_EN;
}
template<> uint8_t getValue<input_D4>(Context ctx) {
    return ctx->_input_D4;
}
template<> uint8_t getValue<input_D5>(Context ctx) {
    return ctx->_input_D5;
}
template<> uint8_t getValue<input_D6>(Context ctx) {
    return ctx->_input_D6;
}
template<> uint8_t getValue<input_D7>(Context ctx) {
    return ctx->_input_D7;
}
template<> XString getValue<input_L1>(Context ctx) {
    return ctx->_input_L1;
}
template<> XString getValue<input_L2>(Context ctx) {
    return ctx->_input_L2;
}
template<> Logic getValue<input_UPD>(Context ctx) {
    return ctx->_input_UPD;
}
template<> Logic getValue<output_DONE>(Context ctx) {
    return ctx->_node->output_DONE;
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            " input_UPD");
    return false;
}

template<> bool isInputDirty<input_UPD>(Context ctx) {
    return ctx->_isInputDirty_UPD;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_DONE");
}

template<> void emitValue<output_DONE>(Context ctx, Logic val) {
    ctx->_node->output_DONE = val;
    ctx->_node->isOutputDirty_DONE = true;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

void printLine(LiquidCrystal* lcd, uint8_t lineIndex, XString str) {
    lcd->setCursor(0, lineIndex);
    uint8_t whitespace = 16;
    for (auto it = str->iterate(); it; ++it, --whitespace)
        lcd->write(*it);

    // Clear the rest of the line
    while (whitespace--)
        lcd->write(' ');
}

void evaluate(Context ctx) {
    if (!isInputDirty<input_UPD>(ctx))
        return;

    State* state = getState(ctx);
    auto lcd = state->lcd;
    if (!state->lcd) {
        state->lcd = lcd = new LiquidCrystal(
            (int)getValue<input_RS>(ctx),
            (int)getValue<input_EN>(ctx),
            (int)getValue<input_D4>(ctx),
            (int)getValue<input_D5>(ctx),
            (int)getValue<input_D6>(ctx),
            (int)getValue<input_D7>(ctx));

        lcd->begin(16, 2);
    }

    printLine(lcd, 0, getValue<input_L1>(ctx));
    printLine(lcd, 1, getValue<input_L2>(ctx));

    emitValue<output_DONE>(ctx, 1);
}

} // namespace xod__common_hardware__text_lcd_16x2

//-----------------------------------------------------------------------------
// xod/core/defer(boolean) implementation
//-----------------------------------------------------------------------------
namespace xod__core__defer__boolean {

struct State {
};

struct Node {
    State state;
    TimeMs timeoutAt;
    Logic output_OUT;

    union {
        struct {
            bool isOutputDirty_OUT : 1;
            bool isNodeDirty : 1;
        };

        DirtyFlags dirtyFlags;
    };
};

struct input_IN { };
struct output_OUT { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_IN> { using T = Logic; };
template<> struct ValueType<output_OUT> { using T = Logic; };

struct ContextObject {
    Node* _node;

    Logic _input_IN;

    bool _isInputDirty_IN;
};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_IN" \
            " output_OUT");
}

template<> Logic getValue<input_IN>(Context ctx) {
    return ctx->_input_IN;
}
template<> Logic getValue<output_OUT>(Context ctx) {
    return ctx->_node->output_OUT;
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            " input_IN");
    return false;
}

template<> bool isInputDirty<input_IN>(Context ctx) {
    return ctx->_isInputDirty_IN;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_OUT");
}

template<> void emitValue<output_OUT>(Context ctx, Logic val) {
    ctx->_node->output_OUT = val;
    ctx->_node->isOutputDirty_OUT = true;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

void evaluate(Context ctx) {
    if (isInputDirty<input_IN>(ctx)) { // This happens only when all nodes are evaluated
        setTimeout(ctx, 0);
        // This will not have any immediate effect, because
        // deferred nodes are at the very bottom of sorted graph.
        // We do this to just save the value for reemission
        // on deferred-only evaluation.
        emitValue<output_OUT>(ctx, getValue<input_IN>(ctx));
    } else { // deferred-only evaluation pass
        emitValue<output_OUT>(ctx, getValue<output_OUT>(ctx));
    }
}

} // namespace xod__core__defer__boolean

} // namespace xod


/*=============================================================================
 *
 *
 * Main loop components
 *
 *
 =============================================================================*/

namespace xod {

// Define/allocate persistent storages (state, timeout, output data) for all nodes

constexpr Logic node_0_output_OUT = false;
xod__core__cast_to_pulse__boolean::Node node_0 = {
    xod__core__cast_to_pulse__boolean::State(), // state default
    node_0_output_OUT, // output OUT default
    false, // OUT dirty
    true // node itself dirty
};

constexpr uint8_t node_1_output_VAL = 10;

constexpr uint8_t node_2_output_VAL = 12;

constexpr uint8_t node_3_output_VAL = 11;

constexpr uint8_t node_4_output_VAL = 9;

constexpr uint8_t node_5_output_VAL = 8;

constexpr uint8_t node_6_output_VAL = 13;

constexpr XString node_7_output_VAL = XString();

constexpr Logic node_8_output_TICK = false;
xod__core__continuously::Node node_8 = {
    xod__core__continuously::State(), // state default
    0, // timeoutAt
    node_8_output_TICK, // output TICK default
    false, // TICK dirty
    true // node itself dirty
};

constexpr Number node_9_output_VAL = 1;

constexpr Logic node_10_output_VAL = true;

constexpr Number node_11_output_VAL = 1;

constexpr Number node_12_output_VAL = 10;

constexpr Logic node_13_output_TICK = false;
xod__core__clock::Node node_13 = {
    xod__core__clock::State(), // state default
    0, // timeoutAt
    node_13_output_TICK, // output TICK default
    false, // TICK dirty
    true // node itself dirty
};

constexpr Number node_14_output_OUT = 0;
xod__core__count::Node node_14 = {
    xod__core__count::State(), // state default
    node_14_output_OUT, // output OUT default
    true, // OUT dirty
    true // node itself dirty
};

constexpr Logic node_15_output_OUT = false;
xod__core__greater::Node node_15 = {
    xod__core__greater::State(), // state default
    node_15_output_OUT, // output OUT default
    true // node itself dirty
};

constexpr XString node_16_output_OUT = XString();
xod__core__cast_to_string__number::Node node_16 = {
    xod__core__cast_to_string__number::State(), // state default
    node_16_output_OUT, // output OUT default
    true // node itself dirty
};

constexpr Logic node_17_output_DONE = false;
xod__common_hardware__text_lcd_16x2::Node node_17 = {
    xod__common_hardware__text_lcd_16x2::State(), // state default
    node_17_output_DONE, // output DONE default
    false, // DONE dirty
    true // node itself dirty
};

constexpr Logic node_18_output_OUT = false;
xod__core__defer__boolean::Node node_18 = {
    xod__core__defer__boolean::State(), // state default
    0, // timeoutAt
    node_18_output_OUT, // output OUT default
    true, // OUT dirty
    true // node itself dirty
};

void runTransaction() {
    g_transactionTime = millis();

    XOD_TRACE_F("Transaction started, t=");
    XOD_TRACE_LN(g_transactionTime);

    // Check for timeouts
    detail::checkTriggerTimeout(&node_8);
    detail::checkTriggerTimeout(&node_13);
    detail::checkTriggerTimeout(&node_18);

    // defer-* nodes are always at the very bottom of the graph, so no one will
    // recieve values emitted by them. We must evaluate them before everybody
    // else to give them a chance to emit values.
    //
    // If trigerred, keep only output dirty, not the node itself, so it will
    // evaluate on the regular pass only if it pushed a new value again.
    {
        if (node_18.isNodeDirty) {
            XOD_TRACE_F("Trigger defer node #");
            XOD_TRACE_LN(18);

            xod__core__defer__boolean::ContextObject ctxObj;
            ctxObj._node = &node_18;
            ctxObj._isInputDirty_IN = false;

            xod__core__defer__boolean::evaluate(&ctxObj);

            // mark downstream nodes dirty
            node_0.isNodeDirty |= node_18.isOutputDirty_OUT;

            node_18.isNodeDirty = false;
            detail::clearTimeout(&node_18);
        }
    }

    // Evaluate all dirty nodes
    { // xod__core__cast_to_pulse__boolean #0
        if (node_0.isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(0);

            xod__core__cast_to_pulse__boolean::ContextObject ctxObj;
            ctxObj._node = &node_0;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_18.output_OUT;

            xod__core__cast_to_pulse__boolean::evaluate(&ctxObj);

            // mark downstream nodes dirty
            node_14.isNodeDirty |= node_0.isOutputDirty_OUT;
        }
    }
    { // xod__core__continuously #8
        if (node_8.isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(8);

            xod__core__continuously::ContextObject ctxObj;
            ctxObj._node = &node_8;

            // copy data from upstream nodes into context

            xod__core__continuously::evaluate(&ctxObj);

            // mark downstream nodes dirty
            node_17.isNodeDirty |= node_8.isOutputDirty_TICK;
        }
    }
    { // xod__core__clock #13
        if (node_13.isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(13);

            xod__core__clock::ContextObject ctxObj;
            ctxObj._node = &node_13;

            // copy data from upstream nodes into context
            ctxObj._input_EN = node_10_output_VAL;
            ctxObj._input_IVAL = node_9_output_VAL;

            ctxObj._isInputDirty_RST = false;
            ctxObj._isInputDirty_EN = g_isSettingUp;

            xod__core__clock::evaluate(&ctxObj);

            // mark downstream nodes dirty
            node_14.isNodeDirty |= node_13.isOutputDirty_TICK;
        }
    }
    { // xod__core__count #14
        if (node_14.isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(14);

            xod__core__count::ContextObject ctxObj;
            ctxObj._node = &node_14;

            // copy data from upstream nodes into context
            ctxObj._input_STEP = node_11_output_VAL;
            ctxObj._input_INC = node_13.output_TICK;
            ctxObj._input_RST = node_0.output_OUT;

            ctxObj._isInputDirty_INC = node_13.isOutputDirty_TICK;
            ctxObj._isInputDirty_RST = node_0.isOutputDirty_OUT;

            xod__core__count::evaluate(&ctxObj);

            // mark downstream nodes dirty
            node_15.isNodeDirty |= node_14.isOutputDirty_OUT;
            node_16.isNodeDirty |= node_14.isOutputDirty_OUT;
        }
    }
    { // xod__core__greater #15
        if (node_15.isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(15);

            xod__core__greater::ContextObject ctxObj;
            ctxObj._node = &node_15;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_14.output_OUT;
            ctxObj._input_IN2 = node_12_output_VAL;

            xod__core__greater::evaluate(&ctxObj);

            // mark downstream nodes dirty
            node_18.isNodeDirty = true;
        }
    }
    { // xod__core__cast_to_string__number #16
        if (node_16.isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(16);

            xod__core__cast_to_string__number::ContextObject ctxObj;
            ctxObj._node = &node_16;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_14.output_OUT;

            xod__core__cast_to_string__number::evaluate(&ctxObj);

            // mark downstream nodes dirty
            node_17.isNodeDirty = true;
        }
    }
    { // xod__common_hardware__text_lcd_16x2 #17
        if (node_17.isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(17);

            xod__common_hardware__text_lcd_16x2::ContextObject ctxObj;
            ctxObj._node = &node_17;

            // copy data from upstream nodes into context
            ctxObj._input_RS = node_5_output_VAL;
            ctxObj._input_EN = node_4_output_VAL;
            ctxObj._input_D4 = node_1_output_VAL;
            ctxObj._input_D5 = node_3_output_VAL;
            ctxObj._input_D6 = node_2_output_VAL;
            ctxObj._input_D7 = node_6_output_VAL;
            ctxObj._input_L1 = node_16.output_OUT;
            ctxObj._input_L2 = node_7_output_VAL;
            ctxObj._input_UPD = node_8.output_TICK;

            ctxObj._isInputDirty_UPD = node_8.isOutputDirty_TICK;

            xod__common_hardware__text_lcd_16x2::evaluate(&ctxObj);

            // mark downstream nodes dirty
        }
    }
    { // xod__core__defer__boolean #18
        if (node_18.isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(18);

            xod__core__defer__boolean::ContextObject ctxObj;
            ctxObj._node = &node_18;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_15.output_OUT;

            ctxObj._isInputDirty_IN = true;

            xod__core__defer__boolean::evaluate(&ctxObj);

            // mark downstream nodes dirty
            node_0.isNodeDirty |= node_18.isOutputDirty_OUT;
        }
    }

    // Clear dirtieness and timeouts for all nodes and pins
    node_0.dirtyFlags = 0;
    node_8.dirtyFlags = 0;
    node_13.dirtyFlags = 0;
    node_14.dirtyFlags = 0;
    node_15.dirtyFlags = 0;
    node_16.dirtyFlags = 0;
    node_17.dirtyFlags = 0;
    node_18.dirtyFlags = 0;
    detail::clearStaleTimeout(&node_8);
    detail::clearStaleTimeout(&node_13);
    detail::clearStaleTimeout(&node_18);

    XOD_TRACE_F("Transaction completed, t=");
    XOD_TRACE_LN(millis());
}

} // namespace xod
