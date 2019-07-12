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


// Uncomment to make possible simulation of the program
//#define XOD_SIMULATION

#ifdef XOD_SIMULATION
#include <WasmSerial.h>
#define XOD_DEBUG_SERIAL WasmSerial
#else
#define XOD_DEBUG_SERIAL DEBUG_SERIAL
#endif

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
 * Basic XOD types
 *
 *
 =============================================================================*/
namespace xod {
#if __SIZEOF_FLOAT__ == 4
typedef float Number;
#else
typedef double Number;
#endif
typedef bool Logic;
typedef unsigned long TimeMs;
typedef uint8_t DirtyFlags;
typedef uint8_t ErrorFlags;
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
    List<T> _left;
    List<T> _right;
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
 * Functions to work with memory
 *
 *
 =============================================================================*/
#ifdef __AVR__
// Placement `new` for Arduino
void* operator new(size_t, void* ptr) {
    return ptr;
}
#endif

/*=============================================================================
 *
 *
 * UART Classes, that wraps Serials
 *
 *
 =============================================================================*/

class HardwareSerial;
class SoftwareSerial;

namespace xod {

class Uart {
  private:
    long _baud;

  protected:
    bool _started = false;

  public:
    Uart(long baud) {
        _baud = baud;
    }

    virtual void begin() = 0;

    virtual void end() = 0;

    virtual void flush() = 0;

    virtual bool available() = 0;

    virtual bool writeByte(uint8_t) = 0;

    virtual bool readByte(uint8_t*) = 0;

    virtual SoftwareSerial* toSoftwareSerial() {
      return nullptr;
    }

    virtual HardwareSerial* toHardwareSerial() {
      return nullptr;
    }

    void changeBaudRate(long baud) {
      _baud = baud;
      if (_started) {
        end();
        begin();
      }
    }

    long getBaudRate() const {
      return _baud;
    }

    Stream* toStream() {
      Stream* stream = (Stream*) toHardwareSerial();
      if (stream) return stream;
      return (Stream*) toSoftwareSerial();
    }
};

class HardwareUart : public Uart {
  private:
    HardwareSerial* _serial;

  public:
    HardwareUart(HardwareSerial& hserial, uint32_t baud = 115200) : Uart(baud) {
      _serial = &hserial;
    }

    void begin();
    void end();
    void flush();

    bool available() {
      return (bool) _serial->available();
    }

    bool writeByte(uint8_t byte) {
      return (bool) _serial->write(byte);
    }

    bool readByte(uint8_t* out) {
      int data = _serial->read();
      if (data == -1) return false;
      *out = data;
      return true;
    }

    HardwareSerial* toHardwareSerial() {
      return _serial;
    }
};

void HardwareUart::begin() {
  _started = true;
  _serial->begin(getBaudRate());
};
void HardwareUart::end() {
  _started = false;
  _serial->end();
};
void HardwareUart::flush() {
  _serial->flush();
};

} // namespace xod

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

template<typename T> bool operator == (List<T> lhs, List<T> rhs) {
  return equal(lhs, rhs);
}

} // namespace xod

#endif

/*=============================================================================
 *
 *
 * Format Numbers
 *
 *
 =============================================================================*/

/**
 * Provide `formatNumber` cross-platform number to string converter function.
 *
 * Taken from here:
 * https://github.com/client9/stringencoders/blob/master/src/modp_numtoa.c
 * Original function name: `modp_dtoa2`.
 *
 * Modified:
 * - `isnan` instead of tricky comparing and return "NaN"
 * - handle Infinity values and return "Inf" or "-Inf"
 * - return `OVF` and `-OVF` for numbers bigger than max possible, instead of using `sprintf`
 * - use `Number` instead of double
 * - if negative number rounds to zero, return just "0" instead of "-0"
 *
 * This is a replacement of `dtostrf`.
 */

#ifndef XOD_FORMAT_NUMBER_H
#define XOD_FORMAT_NUMBER_H

namespace xod {

/**
 * Powers of 10
 * 10^0 to 10^9
 */
static const Number powers_of_10[] = { 1, 10, 100, 1000, 10000, 100000, 1000000,
    10000000, 100000000, 1000000000 };

static void strreverse(char* begin, char* end) {
    char aux;
    while (end > begin)
        aux = *end, *end-- = *begin, *begin++ = aux;
};

size_t formatNumber(Number value, int prec, char* str) {
    if (isnan(value)) {
        strcpy(str, "NaN");
        return (size_t)3;
    }

    if (isinf(value)) {
        bool isNegative = value < 0;
        strcpy(str, isNegative ? "-Inf" : "Inf");
        return (size_t)isNegative ? 4 : 3;
    }

    /* if input is larger than thres_max return "OVF" */
    const Number thres_max = (Number)(0x7FFFFFFF);

    Number diff = 0.0;
    char* wstr = str;

    if (prec < 0) {
        prec = 0;
    } else if (prec > 9) {
        /* precision of >= 10 can lead to overflow errors */
        prec = 9;
    }

    /* we'll work in positive values and deal with the
	   negative sign issue later */
    int neg = 0;
    if (value < 0) {
        neg = 1;
        value = -value;
    }

    uint32_t whole = (uint32_t)value;
    Number tmp = (value - whole) * powers_of_10[prec];
    uint32_t frac = (uint32_t)(tmp);
    diff = tmp - frac;

    if (diff > 0.5) {
        ++frac;
        /* handle rollover, e.g.  case 0.99 with prec 1 is 1.0  */
        if (frac >= powers_of_10[prec]) {
            frac = 0;
            ++whole;
        }
    } else if (diff == 0.5 && prec > 0 && (frac & 1)) {
        /* if halfway, round up if odd, OR
		   if last digit is 0.  That last part is strange */
        ++frac;
        if (frac >= powers_of_10[prec]) {
            frac = 0;
            ++whole;
        }
    } else if (diff == 0.5 && prec == 0 && (whole & 1)) {
        ++frac;
        if (frac >= powers_of_10[prec]) {
            frac = 0;
            ++whole;
        }
    }

    if (value > thres_max) {
        if (neg) {
            strcpy(str, "-OVF");
            return (size_t)4;
        }
        strcpy(str, "OVF");
        return (size_t)3;
    }

    int has_decimal = 0;
    int count = prec;
    bool notzero = frac > 0;

    while (count > 0) {
        --count;
        *wstr++ = (char)(48 + (frac % 10));
        frac /= 10;
        has_decimal = 1;
    }

    if (frac > 0) {
        ++whole;
    }

    /* add decimal */
    if (has_decimal) {
        *wstr++ = '.';
    }

    notzero = notzero || whole > 0;

    /* do whole part
	 * Take care of sign conversion
	 * Number is reversed.
	 */
    do
        *wstr++ = (char)(48 + (whole % 10));
    while (whole /= 10);

    if (neg && notzero) {
        *wstr++ = '-';
    }
    *wstr = '\0';
    strreverse(str, wstr - 1);
    return (size_t)(wstr - str);
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
// #ifndef DEBUG_SERIAL
#if defined(XOD_DEBUG) && !defined(DEBUG_SERIAL)
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

namespace xod {
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

void printErrorToDebugSerial(uint16_t nodeId, uint8_t errorFlags) {
#if defined(XOD_DEBUG) || defined(XOD_SIMULATION)
    XOD_DEBUG_SERIAL.print(F("+XOD_ERR:"));
    XOD_DEBUG_SERIAL.print(g_transactionTime);
    XOD_DEBUG_SERIAL.print(':');
    XOD_DEBUG_SERIAL.print(nodeId);
    XOD_DEBUG_SERIAL.print(':');
    XOD_DEBUG_SERIAL.print(errorFlags, DEC);
    XOD_DEBUG_SERIAL.print('\r');
    XOD_DEBUG_SERIAL.print('\n');
#endif
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

bool isValidDigitalPort(uint8_t port) {
#if defined(__AVR__) && defined(NUM_DIGITAL_PINS)
    return port < NUM_DIGITAL_PINS;
#else
    return true;
#endif
}

bool isValidAnalogPort(uint8_t port) {
#if defined(__AVR__) && defined(NUM_ANALOG_INPUTS)
    return port >= A0 && port < A0 + NUM_ANALOG_INPUTS;
#else
    return true;
#endif
}

} // namespace xod

//----------------------------------------------------------------------------
// Entry point
//----------------------------------------------------------------------------
void setup() {
    // FIXME: looks like there is a rounding bug. Waiting for 100ms fights it
    delay(100);

#if defined(XOD_DEBUG) || defined(XOD_SIMULATION)
    XOD_DEBUG_SERIAL.begin(115200);
    XOD_DEBUG_SERIAL.setTimeout(10);
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
// xod/gpio/digital-read implementation
//-----------------------------------------------------------------------------
namespace xod__gpio__digital_read {

//#pragma XOD error_raise enable

struct State {
};

struct Node {
    State state;
    union {
        struct {
            bool outputHasError_SIG : 1;
            bool outputHasError_DONE : 1;
        };

        ErrorFlags errorFlags;
    };
    Logic output_SIG;
    Logic output_DONE;

    union {
        struct {
            bool isOutputDirty_SIG : 1;
            bool isOutputDirty_DONE : 1;
            bool isNodeDirty : 1;
        };

        DirtyFlags dirtyFlags;
    };
};

struct input_PORT { };
struct input_UPD { };
struct output_SIG { };
struct output_DONE { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_PORT> { using T = uint8_t; };
template<> struct ValueType<input_UPD> { using T = Logic; };
template<> struct ValueType<output_SIG> { using T = Logic; };
template<> struct ValueType<output_DONE> { using T = Logic; };

struct ContextObject {
    Node* _node;
    uint16_t _nodeId;

    uint8_t _input_PORT;
    Logic _input_UPD;

    bool _isInputDirty_UPD;
};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_PORT input_UPD" \
            " output_SIG output_DONE");
}

template<> uint8_t getValue<input_PORT>(Context ctx) {
    return ctx->_input_PORT;
}
template<> Logic getValue<input_UPD>(Context ctx) {
    return ctx->_input_UPD;
}
template<> Logic getValue<output_SIG>(Context ctx) {
    return ctx->_node->output_SIG;
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
            " output_SIG output_DONE");
}

template<> void emitValue<output_SIG>(Context ctx, Logic val) {
    ctx->_node->output_SIG = val;
    ctx->_node->isOutputDirty_SIG = true;
}
template<> void emitValue<output_DONE>(Context ctx, Logic val) {
    ctx->_node->output_DONE = val;
    ctx->_node->isOutputDirty_DONE = true;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

uint16_t getNodeId(Context ctx) {
    return ctx->_nodeId;
}

template<typename OutputT> void raiseError(Context ctx) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_SIG output_DONE");
}

template<> void raiseError<output_SIG>(Context ctx) {
    ctx->_node->outputHasError_SIG = true;
    ctx->_node->isOutputDirty_SIG = true;
}
template<> void raiseError<output_DONE>(Context ctx) {
    ctx->_node->outputHasError_DONE = true;
    ctx->_node->isOutputDirty_DONE = true;
}

void raiseError(Context ctx) {
    ctx->_node->outputHasError_SIG = true;
    ctx->_node->isOutputDirty_SIG = true;
    ctx->_node->outputHasError_DONE = true;
    ctx->_node->isOutputDirty_DONE = true;
}

void evaluate(Context ctx) {
    if (!isInputDirty<input_UPD>(ctx))
        return;

    const uint8_t port = getValue<input_PORT>(ctx);
    if (!isValidDigitalPort(port)) {
        raiseError(ctx);
        return;
    }

    ::pinMode(port, INPUT);
    emitValue<output_SIG>(ctx, ::digitalRead(port));
    emitValue<output_DONE>(ctx, 1);
}

} // namespace xod__gpio__digital_read

//-----------------------------------------------------------------------------
// xod/core/branch implementation
//-----------------------------------------------------------------------------
namespace xod__core__branch {

struct State {
};

struct Node {
    State state;
    Logic output_T;
    Logic output_F;

    union {
        struct {
            bool isOutputDirty_T : 1;
            bool isOutputDirty_F : 1;
            bool isNodeDirty : 1;
        };

        DirtyFlags dirtyFlags;
    };
};

struct input_GATE { };
struct input_TRIG { };
struct output_T { };
struct output_F { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_GATE> { using T = Logic; };
template<> struct ValueType<input_TRIG> { using T = Logic; };
template<> struct ValueType<output_T> { using T = Logic; };
template<> struct ValueType<output_F> { using T = Logic; };

struct ContextObject {
    Node* _node;

    Logic _input_GATE;
    Logic _input_TRIG;

    bool _isInputDirty_TRIG;
};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_GATE input_TRIG" \
            " output_T output_F");
}

template<> Logic getValue<input_GATE>(Context ctx) {
    return ctx->_input_GATE;
}
template<> Logic getValue<input_TRIG>(Context ctx) {
    return ctx->_input_TRIG;
}
template<> Logic getValue<output_T>(Context ctx) {
    return ctx->_node->output_T;
}
template<> Logic getValue<output_F>(Context ctx) {
    return ctx->_node->output_F;
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            " input_TRIG");
    return false;
}

template<> bool isInputDirty<input_TRIG>(Context ctx) {
    return ctx->_isInputDirty_TRIG;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_T output_F");
}

template<> void emitValue<output_T>(Context ctx, Logic val) {
    ctx->_node->output_T = val;
    ctx->_node->isOutputDirty_T = true;
}
template<> void emitValue<output_F>(Context ctx, Logic val) {
    ctx->_node->output_F = val;
    ctx->_node->isOutputDirty_F = true;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

void evaluate(Context ctx) {
    if (!isInputDirty<input_TRIG>(ctx))
        return;

    if (getValue<input_GATE>(ctx)) {
        emitValue<output_T>(ctx, 1);
    } else {
        emitValue<output_F>(ctx, 1);
    }
}

} // namespace xod__core__branch

//-----------------------------------------------------------------------------
// xod/core/flip-flop implementation
//-----------------------------------------------------------------------------
namespace xod__core__flip_flop {

struct State {
};

struct Node {
    State state;
    Logic output_MEM;

    union {
        struct {
            bool isOutputDirty_MEM : 1;
            bool isNodeDirty : 1;
        };

        DirtyFlags dirtyFlags;
    };
};

struct input_SET { };
struct input_TGL { };
struct input_RST { };
struct output_MEM { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_SET> { using T = Logic; };
template<> struct ValueType<input_TGL> { using T = Logic; };
template<> struct ValueType<input_RST> { using T = Logic; };
template<> struct ValueType<output_MEM> { using T = Logic; };

struct ContextObject {
    Node* _node;

    Logic _input_SET;
    Logic _input_TGL;
    Logic _input_RST;

    bool _isInputDirty_SET;
    bool _isInputDirty_TGL;
    bool _isInputDirty_RST;
};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_SET input_TGL input_RST" \
            " output_MEM");
}

template<> Logic getValue<input_SET>(Context ctx) {
    return ctx->_input_SET;
}
template<> Logic getValue<input_TGL>(Context ctx) {
    return ctx->_input_TGL;
}
template<> Logic getValue<input_RST>(Context ctx) {
    return ctx->_input_RST;
}
template<> Logic getValue<output_MEM>(Context ctx) {
    return ctx->_node->output_MEM;
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            " input_SET input_TGL input_RST");
    return false;
}

template<> bool isInputDirty<input_SET>(Context ctx) {
    return ctx->_isInputDirty_SET;
}
template<> bool isInputDirty<input_TGL>(Context ctx) {
    return ctx->_isInputDirty_TGL;
}
template<> bool isInputDirty<input_RST>(Context ctx) {
    return ctx->_isInputDirty_RST;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_MEM");
}

template<> void emitValue<output_MEM>(Context ctx, Logic val) {
    ctx->_node->output_MEM = val;
    ctx->_node->isOutputDirty_MEM = true;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

void evaluate(Context ctx) {
    bool oldState = getValue<output_MEM>(ctx);
    bool newState = oldState;

    if (isInputDirty<input_RST>(ctx)) {
        newState = false;
    } else if (isInputDirty<input_SET>(ctx)) {
        newState = true;
    } else if (isInputDirty<input_TGL>(ctx)) {
        newState = !oldState;
    }

    if (newState == oldState)
        return;

    emitValue<output_MEM>(ctx, newState);
}

} // namespace xod__core__flip_flop

//-----------------------------------------------------------------------------
// xod/gpio/digital-write implementation
//-----------------------------------------------------------------------------
namespace xod__gpio__digital_write {

//#pragma XOD error_raise enable

struct State {
};

struct Node {
    State state;
    union {
        struct {
            bool outputHasError_DONE : 1;
        };

        ErrorFlags errorFlags;
    };
    Logic output_DONE;

    union {
        struct {
            bool isOutputDirty_DONE : 1;
            bool isNodeDirty : 1;
        };

        DirtyFlags dirtyFlags;
    };
};

struct input_PORT { };
struct input_SIG { };
struct input_UPD { };
struct output_DONE { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_PORT> { using T = uint8_t; };
template<> struct ValueType<input_SIG> { using T = Logic; };
template<> struct ValueType<input_UPD> { using T = Logic; };
template<> struct ValueType<output_DONE> { using T = Logic; };

struct ContextObject {
    Node* _node;
    uint16_t _nodeId;

    uint8_t _input_PORT;
    Logic _input_SIG;
    Logic _input_UPD;

    bool _isInputDirty_UPD;
};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_PORT input_SIG input_UPD" \
            " output_DONE");
}

template<> uint8_t getValue<input_PORT>(Context ctx) {
    return ctx->_input_PORT;
}
template<> Logic getValue<input_SIG>(Context ctx) {
    return ctx->_input_SIG;
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

uint16_t getNodeId(Context ctx) {
    return ctx->_nodeId;
}

template<typename OutputT> void raiseError(Context ctx) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_DONE");
}

template<> void raiseError<output_DONE>(Context ctx) {
    ctx->_node->outputHasError_DONE = true;
    ctx->_node->isOutputDirty_DONE = true;
}

void raiseError(Context ctx) {
    ctx->_node->outputHasError_DONE = true;
    ctx->_node->isOutputDirty_DONE = true;
}

void evaluate(Context ctx) {
    if (!isInputDirty<input_UPD>(ctx))
        return;

    const uint8_t port = getValue<input_PORT>(ctx);
    if (!isValidDigitalPort(port)) {
        raiseError<output_DONE>(ctx);
        return;
    }

    ::pinMode(port, OUTPUT);
    const bool val = getValue<input_SIG>(ctx);
    ::digitalWrite(port, val);
    emitValue<output_DONE>(ctx, 1);
}

} // namespace xod__gpio__digital_write

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
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wmissing-field-initializers"

constexpr uint8_t node_0_output_VAL = 13;

constexpr uint8_t node_1_output_VAL = 11;

constexpr uint8_t node_2_output_VAL = 13;

constexpr Logic node_3_output_TICK = false;

constexpr Logic node_4_output_SIG = false;
constexpr Logic node_4_output_DONE = false;

constexpr Logic node_5_output_SIG = false;
constexpr Logic node_5_output_DONE = false;

constexpr Logic node_6_output_T = false;
constexpr Logic node_6_output_F = false;

constexpr Logic node_7_output_T = false;
constexpr Logic node_7_output_F = false;

constexpr Logic node_8_output_MEM = false;

constexpr Logic node_9_output_DONE = false;

#pragma GCC diagnostic pop

xod__core__continuously::Node node_3 = {
    xod__core__continuously::State(), // state default
    0, // timeoutAt
    node_3_output_TICK, // output TICK default
    false, // TICK dirty
    true // node itself dirty
};
xod__gpio__digital_read::Node node_4 = {
    xod__gpio__digital_read::State(), // state default
    false, // SIG has no errors on start
    false, // DONE has no errors on start
    node_4_output_SIG, // output SIG default
    node_4_output_DONE, // output DONE default
    true, // SIG dirty
    false, // DONE dirty
    true // node itself dirty
};
xod__gpio__digital_read::Node node_5 = {
    xod__gpio__digital_read::State(), // state default
    false, // SIG has no errors on start
    false, // DONE has no errors on start
    node_5_output_SIG, // output SIG default
    node_5_output_DONE, // output DONE default
    true, // SIG dirty
    false, // DONE dirty
    true // node itself dirty
};
xod__core__branch::Node node_6 = {
    xod__core__branch::State(), // state default
    node_6_output_T, // output T default
    node_6_output_F, // output F default
    false, // T dirty
    false, // F dirty
    true // node itself dirty
};
xod__core__branch::Node node_7 = {
    xod__core__branch::State(), // state default
    node_7_output_T, // output T default
    node_7_output_F, // output F default
    false, // T dirty
    false, // F dirty
    true // node itself dirty
};
xod__core__flip_flop::Node node_8 = {
    xod__core__flip_flop::State(), // state default
    node_8_output_MEM, // output MEM default
    true, // MEM dirty
    true // node itself dirty
};
xod__gpio__digital_write::Node node_9 = {
    xod__gpio__digital_write::State(), // state default
    false, // DONE has no errors on start
    node_9_output_DONE, // output DONE default
    false, // DONE dirty
    true // node itself dirty
};

#if defined(XOD_DEBUG) || defined(XOD_SIMULATION)
namespace detail {
void handleTweaks() {
    if (XOD_DEBUG_SERIAL.available() > 0 && XOD_DEBUG_SERIAL.find("+XOD:", 5)) {
        int tweakedNodeId = XOD_DEBUG_SERIAL.parseInt();

        switch (tweakedNodeId) {
        }

        XOD_DEBUG_SERIAL.find('\n');
    }
}
} // namespace detail
#endif

void runTransaction() {
    g_transactionTime = millis();

    XOD_TRACE_F("Transaction started, t=");
    XOD_TRACE_LN(g_transactionTime);

#if defined(XOD_DEBUG) || defined(XOD_SIMULATION)
    detail::handleTweaks();
#endif

    // Check for timeouts
    detail::checkTriggerTimeout(&node_3);

    // defer-* nodes are always at the very bottom of the graph, so no one will
    // recieve values emitted by them. We must evaluate them before everybody
    // else to give them a chance to emit values.
    //
    // If trigerred, keep only output dirty, not the node itself, so it will
    // evaluate on the regular pass only if it pushed a new value again.

    // Evaluate all dirty nodes
    { // xod__core__continuously #3
        if (node_3.isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(3);

            xod__core__continuously::ContextObject ctxObj;
            ctxObj._node = &node_3;

            // copy data from upstream nodes into context

            xod__core__continuously::evaluate(&ctxObj);

            // mark downstream nodes dirty
            node_4.isNodeDirty |= node_3.isOutputDirty_TICK;
            node_6.isNodeDirty |= node_3.isOutputDirty_TICK;
            node_5.isNodeDirty |= node_3.isOutputDirty_TICK;
            node_7.isNodeDirty |= node_3.isOutputDirty_TICK;
            node_9.isNodeDirty |= node_3.isOutputDirty_TICK;
        }
    }
    { // xod__gpio__digital_read #4
        if (node_4.isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(4);

            xod__gpio__digital_read::ContextObject ctxObj;
            ctxObj._node = &node_4;
            ctxObj._nodeId = 4;

            // copy data from upstream nodes into context
            ctxObj._input_PORT = node_0_output_VAL;
            ctxObj._input_UPD = node_3.output_TICK;

            ctxObj._isInputDirty_UPD = node_3.isOutputDirty_TICK;

#if defined(XOD_DEBUG) || defined(XOD_SIMULATION)
            ErrorFlags previousErrorFlags = node_4.errorFlags;
#endif
            // give the node a chance to recover from it's own previous errors
            node_4.errorFlags = 0;

            xod__gpio__digital_read::evaluate(&ctxObj);

#if defined(XOD_DEBUG) || defined(XOD_SIMULATION)
            if (previousErrorFlags != node_4.errorFlags) {
                detail::printErrorToDebugSerial(4, node_4.errorFlags);
            }
#endif

            // mark downstream nodes dirty
            node_6.isNodeDirty |= node_4.isOutputDirty_SIG;
        }
    }
    { // xod__gpio__digital_read #5
        if (node_5.isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(5);

            xod__gpio__digital_read::ContextObject ctxObj;
            ctxObj._node = &node_5;
            ctxObj._nodeId = 5;

            // copy data from upstream nodes into context
            ctxObj._input_PORT = node_1_output_VAL;
            ctxObj._input_UPD = node_3.output_TICK;

            ctxObj._isInputDirty_UPD = node_3.isOutputDirty_TICK;

#if defined(XOD_DEBUG) || defined(XOD_SIMULATION)
            ErrorFlags previousErrorFlags = node_5.errorFlags;
#endif
            // give the node a chance to recover from it's own previous errors
            node_5.errorFlags = 0;

            xod__gpio__digital_read::evaluate(&ctxObj);

#if defined(XOD_DEBUG) || defined(XOD_SIMULATION)
            if (previousErrorFlags != node_5.errorFlags) {
                detail::printErrorToDebugSerial(5, node_5.errorFlags);
            }
#endif

            // mark downstream nodes dirty
            node_7.isNodeDirty |= node_5.isOutputDirty_SIG;
        }
    }
    { // xod__core__branch #6
        bool error_input_GATE = false;
        error_input_GATE |= node_4.outputHasError_SIG;

        bool hasUpstreamError = false;
        hasUpstreamError |= error_input_GATE;

        if (node_6.isNodeDirty && !hasUpstreamError) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(6);

            xod__core__branch::ContextObject ctxObj;
            ctxObj._node = &node_6;

            // copy data from upstream nodes into context
            ctxObj._input_GATE = node_4.output_SIG;
            ctxObj._input_TRIG = node_3.output_TICK;

            ctxObj._isInputDirty_TRIG = node_3.isOutputDirty_TICK;

            xod__core__branch::evaluate(&ctxObj);

        }
        // even if the node did not evaluate, mark downstream nodes as
        // dirty to spread the errors to the catchers
        if (node_6.isNodeDirty) {
            // mark downstream nodes dirty
            node_8.isNodeDirty |= node_6.isOutputDirty_F;
        }
    }
    { // xod__core__branch #7
        bool error_input_GATE = false;
        error_input_GATE |= node_5.outputHasError_SIG;

        bool hasUpstreamError = false;
        hasUpstreamError |= error_input_GATE;

        if (node_7.isNodeDirty && !hasUpstreamError) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(7);

            xod__core__branch::ContextObject ctxObj;
            ctxObj._node = &node_7;

            // copy data from upstream nodes into context
            ctxObj._input_GATE = node_5.output_SIG;
            ctxObj._input_TRIG = node_3.output_TICK;

            ctxObj._isInputDirty_TRIG = node_3.isOutputDirty_TICK;

            xod__core__branch::evaluate(&ctxObj);

        }
        // even if the node did not evaluate, mark downstream nodes as
        // dirty to spread the errors to the catchers
        if (node_7.isNodeDirty) {
            // mark downstream nodes dirty
            node_8.isNodeDirty |= node_7.isOutputDirty_F;
        }
    }
    { // xod__core__flip_flop #8
        bool error_input_SET = false;
        error_input_SET |= node_5.outputHasError_SIG;
        bool error_input_RST = false;
        error_input_RST |= node_4.outputHasError_SIG;

        bool hasUpstreamError = false;
        hasUpstreamError |= error_input_SET;
        hasUpstreamError |= error_input_RST;

        if (node_8.isNodeDirty && !hasUpstreamError) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(8);

            xod__core__flip_flop::ContextObject ctxObj;
            ctxObj._node = &node_8;

            // copy data from upstream nodes into context
            ctxObj._input_SET = node_7.output_F;
            ctxObj._input_RST = node_6.output_F;

            ctxObj._isInputDirty_TGL = false;
            ctxObj._isInputDirty_SET = node_7.isOutputDirty_F;
            ctxObj._isInputDirty_RST = node_6.isOutputDirty_F;

            xod__core__flip_flop::evaluate(&ctxObj);

        }
        // even if the node did not evaluate, mark downstream nodes as
        // dirty to spread the errors to the catchers
        if (node_8.isNodeDirty) {
            // mark downstream nodes dirty
            node_9.isNodeDirty |= node_8.isOutputDirty_MEM;
        }
    }
    { // xod__gpio__digital_write #9
        bool error_input_SIG = false;
        error_input_SIG |= node_5.outputHasError_SIG;
        error_input_SIG |= node_4.outputHasError_SIG;

        bool hasUpstreamError = false;
        hasUpstreamError |= error_input_SIG;

        if (node_9.isNodeDirty && !hasUpstreamError) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(9);

            xod__gpio__digital_write::ContextObject ctxObj;
            ctxObj._node = &node_9;
            ctxObj._nodeId = 9;

            // copy data from upstream nodes into context
            ctxObj._input_PORT = node_2_output_VAL;
            ctxObj._input_SIG = node_8.output_MEM;
            ctxObj._input_UPD = node_3.output_TICK;

            ctxObj._isInputDirty_UPD = node_3.isOutputDirty_TICK;

#if defined(XOD_DEBUG) || defined(XOD_SIMULATION)
            ErrorFlags previousErrorFlags = node_9.errorFlags;
#endif
            // give the node a chance to recover from it's own previous errors
            node_9.errorFlags = 0;

            xod__gpio__digital_write::evaluate(&ctxObj);

#if defined(XOD_DEBUG) || defined(XOD_SIMULATION)
            if (previousErrorFlags != node_9.errorFlags) {
                detail::printErrorToDebugSerial(9, node_9.errorFlags);
            }
#endif

        }
        // even if the node did not evaluate, mark downstream nodes as
        // dirty to spread the errors to the catchers
        if (node_9.isNodeDirty) {
            // mark downstream nodes dirty
        }
    }

    // Clear dirtieness and timeouts for all nodes and pins
    node_3.dirtyFlags = 0;
    node_4.dirtyFlags = 0;
    node_5.dirtyFlags = 0;
    node_6.dirtyFlags = 0;
    node_7.dirtyFlags = 0;
    node_8.dirtyFlags = 0;
    node_9.dirtyFlags = 0;

    // Сlean errors from pulse outputs
    if (node_4.outputHasError_DONE) {
      node_4.outputHasError_DONE = false;
      detail::printErrorToDebugSerial(4, node_4.errorFlags);
    }
    if (node_5.outputHasError_DONE) {
      node_5.outputHasError_DONE = false;
      detail::printErrorToDebugSerial(5, node_5.errorFlags);
    }
    if (node_9.outputHasError_DONE) {
      node_9.outputHasError_DONE = false;
      detail::printErrorToDebugSerial(9, node_9.errorFlags);
    }

    detail::clearStaleTimeout(&node_3);

    XOD_TRACE_F("Transaction completed, t=");
    XOD_TRACE_LN(millis());
}

} // namespace xod
