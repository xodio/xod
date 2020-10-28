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
typedef uint8_t ErrorFlags;

struct Pulse {
    Pulse() {}
    Pulse(bool) {}
    Pulse(int) {}
};

struct XColor {
    constexpr XColor()
        : r(0)
        , g(0)
        , b(0) {}
    constexpr XColor(uint8_t cr, uint8_t cg, uint8_t cb)
        : r(cr)
        , g(cg)
        , b(cb) {}
    uint8_t r, g, b;
};

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

// Define the placement new operator for cores that do not provide their own.
// Note, this definition takes precedence over the existing one (if any). We found no C++ way
// to use the existing implementation _and_ this implementation if not yet defined.
template<typename T>
void* operator new(size_t, T* ptr) noexcept {
    return ptr;
}

/*=============================================================================
 *
 *
 * UART Classes, that wraps Serials
 *
 *
 =============================================================================*/


#if ARDUINO_API_VERSION >= 10001
class arduino::HardwareSerial;
#else
class HardwareSerial;
#endif
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
bool g_isEarlyDeferPass;

//----------------------------------------------------------------------------
// Metaprogramming utilities
//----------------------------------------------------------------------------

template<typename T> struct always_false {
    enum { value = 0 };
};

template<typename T> struct identity {
  typedef T type;
};

template<typename T> struct remove_pointer                    {typedef T type;};
template<typename T> struct remove_pointer<T*>                {typedef T type;};
template<typename T> struct remove_pointer<T* const>          {typedef T type;};
template<typename T> struct remove_pointer<T* volatile>       {typedef T type;};
template<typename T> struct remove_pointer<T* const volatile> {typedef T type;};

template <typename T, typename M> M get_member_type(M T:: *);

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

template<typename NodeT>
void clearTimeout(NodeT* node) {
    node->timeoutAt = 0;
}

template<typename NodeT>
void clearStaleTimeout(NodeT* node) {
    if (isTimedOut(node))
        clearTimeout(node);
}

void printErrorToDebugSerial(uint16_t nodeId, ErrorFlags errorFlags) {
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

bool isEarlyDeferPass() {
    return g_isEarlyDeferPass;
}

constexpr bool isValidDigitalPort(uint8_t port) {
#if defined(__AVR__) && defined(NUM_DIGITAL_PINS)
    return port < NUM_DIGITAL_PINS;
#else
    return true;
#endif
}

constexpr bool isValidAnalogPort(uint8_t port) {
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

//-----------------------------------------------------------------------------
// xod-dev/text-lcd/text-lcd-i2c-device implementation
//-----------------------------------------------------------------------------
//#pragma XOD error_raise enable

#include <Wire.h>
#include <LiquidCrystal_I2C.h>

namespace xod {
namespace xod_dev__text_lcd__text_lcd_i2c_device {
struct Node {

    typedef uint8_t typeof_ADDR;
    typedef Number typeof_COLS;
    typedef Number typeof_ROWS;

    struct Type {
        LiquidCrystal_I2C* lcd;
        uint8_t rows;
        uint8_t cols;
    };

    typedef Type typeof_DEV;

    struct input_ADDR { };
    struct input_COLS { };
    struct input_ROWS { };
    struct output_DEV { };

    static const identity<typeof_ADDR> getValueType(input_ADDR) {
      return identity<typeof_ADDR>();
    }
    static const identity<typeof_COLS> getValueType(input_COLS) {
      return identity<typeof_COLS>();
    }
    static const identity<typeof_ROWS> getValueType(input_ROWS) {
      return identity<typeof_ROWS>();
    }
    static const identity<typeof_DEV> getValueType(output_DEV) {
      return identity<typeof_DEV>();
    }

    union NodeErrors {
        struct {
            bool output_DEV : 1;
        };

        ErrorFlags flags = 0;
    };

    NodeErrors errors = {};

    typeof_DEV _output_DEV;

    Node (typeof_DEV output_DEV) {
        _output_DEV = output_DEV;
    }

    struct ContextObject {

        typeof_ADDR _input_ADDR;
        typeof_COLS _input_COLS;
        typeof_ROWS _input_ROWS;

        bool _isOutputDirty_DEV : 1;
    };

    using Context = ContextObject*;

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_ADDR input_COLS input_ROWS" \
                " output_DEV");
    }

    typeof_ADDR getValue(Context ctx, identity<input_ADDR>) {
        return ctx->_input_ADDR;
    }
    typeof_COLS getValue(Context ctx, identity<input_COLS>) {
        return ctx->_input_COLS;
    }
    typeof_ROWS getValue(Context ctx, identity<input_ROWS>) {
        return ctx->_input_ROWS;
    }
    typeof_DEV getValue(Context ctx, identity<output_DEV>) {
        return this->_output_DEV;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_DEV");
    }

    void emitValue(Context ctx, typeof_DEV val, identity<output_DEV>) {
        this->_output_DEV = val;
        ctx->_isOutputDirty_DEV = true;
        this->errors.output_DEV = false;
    }

    template<typename OutputT> void raiseError(Context ctx) {
        raiseError(ctx, identity<OutputT>());
    }

    template<typename OutputT> void raiseError(Context ctx, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_DEV");
    }

    void raiseError(Context ctx, identity<output_DEV>) {
        this->errors.output_DEV = true;
        ctx->_isOutputDirty_DEV = true;
    }

    void raiseError(Context ctx) {
        this->errors.output_DEV = true;
        ctx->_isOutputDirty_DEV = true;
    }

    uint8_t mem[sizeof(LiquidCrystal_I2C)];

    void evaluate(Context ctx) {
        uint8_t addr = getValue<input_ADDR>(ctx);
        uint8_t rows = (uint8_t) getValue<input_ROWS>(ctx);
        uint8_t cols = (uint8_t) getValue<input_COLS>(ctx);

        if (addr > 127) {
            raiseError(ctx);
            return;
        }

        Type t;
        t.rows = rows;
        t.cols = cols;
        // do we need `&` here?
        t.lcd = new (mem) LiquidCrystal_I2C(addr, cols, rows);
        t.lcd->begin();

        emitValue<output_DEV>(ctx, t);
    }

};
} // namespace xod_dev__text_lcd__text_lcd_i2c_device
} // namespace xod

//-----------------------------------------------------------------------------
// xod-dev/servo/servo-device implementation
//-----------------------------------------------------------------------------
//#pragma XOD error_raise enable

#ifdef ESP32
#include <ESP32Servo.h>
#else
#include <Servo.h>
#endif

namespace xod {
namespace xod_dev__servo__servo_device {
template <uint8_t constant_input_PORT>
struct Node {

    typedef uint8_t typeof_PORT;
    typedef Number typeof_Pmin;
    typedef Number typeof_Pmax;

    /*
    A wrapper around the stock Servo object because we need to keep some details
    which the original object hides in private fields. This over-protection leads
    to increased RAM usage to duplicate the data. A pull request to the original
    library asking to add field read methods would be nice.
    */
    class XServo : public Servo {
      protected:
        // Here are the duplicates
        uint8_t port;
        int pulseMin;
        int pulseMax;

      public:
        // Set pulse duration according the given `value` and set pulseMin, pulseMax
        // The value is clipped to the [0; 1] range
        void write01(Number value) {
            ensureAttached();
            int pseudoAngle = constrain((int)(value * 180), 0, 180);
            this->write(pseudoAngle);
        }

        // Performs Servo::attach with the parameters set previously
        void ensureAttached() {
            if (this->attached())
                return;

            this->attach(port, pulseMin, pulseMax);
        }

        Number read01() {
            int us = this->readMicroseconds();
            return (Number)(us - pulseMin) / (Number)(pulseMax - pulseMin);
        }

        void reattach(uint8_t port, int pulseMin, int pulseMax) {
            this->port = port;
            this->pulseMin = pulseMin;
            this->pulseMax = pulseMax;
            if (this->attached())
                this->attach(port, pulseMin, pulseMax);
        }
    };

    using Type = XServo*;

    typedef Type typeof_DEV;

    struct input_PORT { };
    struct input_Pmin { };
    struct input_Pmax { };
    struct output_DEV { };

    static const identity<typeof_PORT> getValueType(input_PORT) {
      return identity<typeof_PORT>();
    }
    static const identity<typeof_Pmin> getValueType(input_Pmin) {
      return identity<typeof_Pmin>();
    }
    static const identity<typeof_Pmax> getValueType(input_Pmax) {
      return identity<typeof_Pmax>();
    }
    static const identity<typeof_DEV> getValueType(output_DEV) {
      return identity<typeof_DEV>();
    }

    union NodeErrors {
        struct {
            bool output_DEV : 1;
        };

        ErrorFlags flags = 0;
    };

    NodeErrors errors = {};

    typeof_DEV _output_DEV;

    Node (typeof_DEV output_DEV) {
        _output_DEV = output_DEV;
    }

    struct ContextObject {

        typeof_Pmin _input_Pmin;
        typeof_Pmax _input_Pmax;

        bool _isOutputDirty_DEV : 1;
    };

    using Context = ContextObject*;

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_PORT input_Pmin input_Pmax" \
                " output_DEV");
    }

    typeof_PORT getValue(Context ctx, identity<input_PORT>) {
        return constant_input_PORT;
    }
    typeof_Pmin getValue(Context ctx, identity<input_Pmin>) {
        return ctx->_input_Pmin;
    }
    typeof_Pmax getValue(Context ctx, identity<input_Pmax>) {
        return ctx->_input_Pmax;
    }
    typeof_DEV getValue(Context ctx, identity<output_DEV>) {
        return this->_output_DEV;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_DEV");
    }

    void emitValue(Context ctx, typeof_DEV val, identity<output_DEV>) {
        this->_output_DEV = val;
        ctx->_isOutputDirty_DEV = true;
        this->errors.output_DEV = false;
    }

    template<typename OutputT> void raiseError(Context ctx) {
        raiseError(ctx, identity<OutputT>());
    }

    template<typename OutputT> void raiseError(Context ctx, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_DEV");
    }

    void raiseError(Context ctx, identity<output_DEV>) {
        this->errors.output_DEV = true;
        ctx->_isOutputDirty_DEV = true;
    }

    void raiseError(Context ctx) {
        this->errors.output_DEV = true;
        ctx->_isOutputDirty_DEV = true;
    }

    XServo servo;

    void evaluate(Context ctx) {
        static_assert(isValidDigitalPort(constant_input_PORT), "must be a valid digital port");

        servo.reattach(
            constant_input_PORT,
            getValue<input_Pmin>(ctx),
            getValue<input_Pmax>(ctx)
        );

        emitValue<output_DEV>(ctx, &servo);
    }

};
} // namespace xod_dev__servo__servo_device
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/continuously implementation
//-----------------------------------------------------------------------------
namespace xod {
namespace xod__core__continuously {
struct Node {

    typedef Pulse typeof_TICK;

    struct output_TICK { };

    static const identity<typeof_TICK> getValueType(output_TICK) {
      return identity<typeof_TICK>();
    }

    bool isSetImmediate = false;

    Node () {
    }

    struct ContextObject {

        bool _isOutputDirty_TICK : 1;
    };

    using Context = ContextObject*;

    void setImmediate() {
      this->isSetImmediate = true;
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                "" \
                " output_TICK");
    }

    typeof_TICK getValue(Context ctx, identity<output_TICK>) {
        return Pulse();
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_TICK");
    }

    void emitValue(Context ctx, typeof_TICK val, identity<output_TICK>) {
        ctx->_isOutputDirty_TICK = true;
    }

    void evaluate(Context ctx) {
        emitValue<output_TICK>(ctx, 1);
        setImmediate();
    }

};
} // namespace xod__core__continuously
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/boot implementation
//-----------------------------------------------------------------------------
namespace xod {
namespace xod__core__boot {
struct Node {

    typedef Pulse typeof_BOOT;

    struct output_BOOT { };

    static const identity<typeof_BOOT> getValueType(output_BOOT) {
      return identity<typeof_BOOT>();
    }

    Node () {
    }

    struct ContextObject {

        bool _isOutputDirty_BOOT : 1;
    };

    using Context = ContextObject*;

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                "" \
                " output_BOOT");
    }

    typeof_BOOT getValue(Context ctx, identity<output_BOOT>) {
        return Pulse();
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_BOOT");
    }

    void emitValue(Context ctx, typeof_BOOT val, identity<output_BOOT>) {
        ctx->_isOutputDirty_BOOT = true;
    }

    void evaluate(Context ctx) {
        emitValue<output_BOOT>(ctx, 1);
    }

};
} // namespace xod__core__boot
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/multiply implementation
//-----------------------------------------------------------------------------
//#pragma XOD dirtieness disable

namespace xod {
namespace xod__core__multiply {
struct Node {

    typedef Number typeof_IN1;
    typedef Number typeof_IN2;

    typedef Number typeof_OUT;

    struct input_IN1 { };
    struct input_IN2 { };
    struct output_OUT { };

    static const identity<typeof_IN1> getValueType(input_IN1) {
      return identity<typeof_IN1>();
    }
    static const identity<typeof_IN2> getValueType(input_IN2) {
      return identity<typeof_IN2>();
    }
    static const identity<typeof_OUT> getValueType(output_OUT) {
      return identity<typeof_OUT>();
    }

    typeof_OUT _output_OUT;

    Node (typeof_OUT output_OUT) {
        _output_OUT = output_OUT;
    }

    struct ContextObject {

        typeof_IN1 _input_IN1;
        typeof_IN2 _input_IN2;

    };

    using Context = ContextObject*;

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN1 input_IN2" \
                " output_OUT");
    }

    typeof_IN1 getValue(Context ctx, identity<input_IN1>) {
        return ctx->_input_IN1;
    }
    typeof_IN2 getValue(Context ctx, identity<input_IN2>) {
        return ctx->_input_IN2;
    }
    typeof_OUT getValue(Context ctx, identity<output_OUT>) {
        return this->_output_OUT;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, typeof_OUT val, identity<output_OUT>) {
        this->_output_OUT = val;
    }

    void evaluate(Context ctx) {
        auto x = getValue<input_IN1>(ctx);
        auto y = getValue<input_IN2>(ctx);
        emitValue<output_OUT>(ctx, x * y);
    }

};
} // namespace xod__core__multiply
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/pulse-on-change(boolean) implementation
//-----------------------------------------------------------------------------

namespace xod {
namespace xod__core__pulse_on_change__boolean {
struct Node {

    typedef Logic typeof_IN;

    typedef Pulse typeof_OUT;

    struct input_IN { };
    struct output_OUT { };

    static const identity<typeof_IN> getValueType(input_IN) {
      return identity<typeof_IN>();
    }
    static const identity<typeof_OUT> getValueType(output_OUT) {
      return identity<typeof_OUT>();
    }

    Node () {
    }

    struct ContextObject {

        typeof_IN _input_IN;

        bool _isOutputDirty_OUT : 1;
    };

    using Context = ContextObject*;

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN" \
                " output_OUT");
    }

    typeof_IN getValue(Context ctx, identity<input_IN>) {
        return ctx->_input_IN;
    }
    typeof_OUT getValue(Context ctx, identity<output_OUT>) {
        return Pulse();
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, typeof_OUT val, identity<output_OUT>) {
        ctx->_isOutputDirty_OUT = true;
    }

    bool sample = false;

    void evaluate(Context ctx) {
        int8_t newValue = (int8_t) getValue<input_IN>(ctx);

        if (!isSettingUp() && newValue != sample)
            emitValue<output_OUT>(ctx, 1);

        sample = newValue;
    }

};
} // namespace xod__core__pulse_on_change__boolean
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/divide implementation
//-----------------------------------------------------------------------------
//#pragma XOD dirtieness disable

namespace xod {
namespace xod__core__divide {
struct Node {

    typedef Number typeof_IN1;
    typedef Number typeof_IN2;

    typedef Number typeof_OUT;

    struct input_IN1 { };
    struct input_IN2 { };
    struct output_OUT { };

    static const identity<typeof_IN1> getValueType(input_IN1) {
      return identity<typeof_IN1>();
    }
    static const identity<typeof_IN2> getValueType(input_IN2) {
      return identity<typeof_IN2>();
    }
    static const identity<typeof_OUT> getValueType(output_OUT) {
      return identity<typeof_OUT>();
    }

    typeof_OUT _output_OUT;

    Node (typeof_OUT output_OUT) {
        _output_OUT = output_OUT;
    }

    struct ContextObject {

        typeof_IN1 _input_IN1;
        typeof_IN2 _input_IN2;

    };

    using Context = ContextObject*;

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN1 input_IN2" \
                " output_OUT");
    }

    typeof_IN1 getValue(Context ctx, identity<input_IN1>) {
        return ctx->_input_IN1;
    }
    typeof_IN2 getValue(Context ctx, identity<input_IN2>) {
        return ctx->_input_IN2;
    }
    typeof_OUT getValue(Context ctx, identity<output_OUT>) {
        return this->_output_OUT;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, typeof_OUT val, identity<output_OUT>) {
        this->_output_OUT = val;
    }

    void evaluate(Context ctx) {
        auto x = getValue<input_IN1>(ctx);
        auto y = getValue<input_IN2>(ctx);
        emitValue<output_OUT>(ctx, x / y);
    }

};
} // namespace xod__core__divide
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/cast-to-pulse(boolean) implementation
//-----------------------------------------------------------------------------
namespace xod {
namespace xod__core__cast_to_pulse__boolean {
struct Node {

    typedef Logic typeof_IN;

    typedef Pulse typeof_OUT;

    struct input_IN { };
    struct output_OUT { };

    static const identity<typeof_IN> getValueType(input_IN) {
      return identity<typeof_IN>();
    }
    static const identity<typeof_OUT> getValueType(output_OUT) {
      return identity<typeof_OUT>();
    }

    Node () {
    }

    struct ContextObject {

        typeof_IN _input_IN;

        bool _isOutputDirty_OUT : 1;
    };

    using Context = ContextObject*;

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN" \
                " output_OUT");
    }

    typeof_IN getValue(Context ctx, identity<input_IN>) {
        return ctx->_input_IN;
    }
    typeof_OUT getValue(Context ctx, identity<output_OUT>) {
        return Pulse();
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, typeof_OUT val, identity<output_OUT>) {
        ctx->_isOutputDirty_OUT = true;
    }

    bool state = false;

    void evaluate(Context ctx) {
        auto newValue = getValue<input_IN>(ctx);

        if (newValue == true && state == false)
            emitValue<output_OUT>(ctx, 1);

        state = newValue;
    }

};
} // namespace xod__core__cast_to_pulse__boolean
} // namespace xod

//-----------------------------------------------------------------------------
// xod/gpio/analog-read implementation
//-----------------------------------------------------------------------------
//#pragma XOD evaluate_on_pin disable
//#pragma XOD evaluate_on_pin enable input_UPD

namespace xod {
namespace xod__gpio__analog_read {
template <uint8_t constant_input_PORT>
struct Node {

    typedef uint8_t typeof_PORT;
    typedef Pulse typeof_UPD;

    typedef Number typeof_VAL;
    typedef Pulse typeof_DONE;

    struct input_PORT { };
    struct input_UPD { };
    struct output_VAL { };
    struct output_DONE { };

    static const identity<typeof_PORT> getValueType(input_PORT) {
      return identity<typeof_PORT>();
    }
    static const identity<typeof_UPD> getValueType(input_UPD) {
      return identity<typeof_UPD>();
    }
    static const identity<typeof_VAL> getValueType(output_VAL) {
      return identity<typeof_VAL>();
    }
    static const identity<typeof_DONE> getValueType(output_DONE) {
      return identity<typeof_DONE>();
    }

    typeof_VAL _output_VAL;

    Node (typeof_VAL output_VAL) {
        _output_VAL = output_VAL;
    }

    struct ContextObject {

        bool _isInputDirty_UPD;

        bool _isOutputDirty_VAL : 1;
        bool _isOutputDirty_DONE : 1;
    };

    using Context = ContextObject*;

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_PORT input_UPD" \
                " output_VAL output_DONE");
    }

    typeof_PORT getValue(Context ctx, identity<input_PORT>) {
        return constant_input_PORT;
    }
    typeof_UPD getValue(Context ctx, identity<input_UPD>) {
        return Pulse();
    }
    typeof_VAL getValue(Context ctx, identity<output_VAL>) {
        return this->_output_VAL;
    }
    typeof_DONE getValue(Context ctx, identity<output_DONE>) {
        return Pulse();
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                " input_UPD");
        return false;
    }

    bool isInputDirty(Context ctx, identity<input_UPD>) {
        return ctx->_isInputDirty_UPD;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_VAL output_DONE");
    }

    void emitValue(Context ctx, typeof_VAL val, identity<output_VAL>) {
        this->_output_VAL = val;
        ctx->_isOutputDirty_VAL = true;
    }
    void emitValue(Context ctx, typeof_DONE val, identity<output_DONE>) {
        ctx->_isOutputDirty_DONE = true;
    }

// reading from analog input too frequently may affect WiFi connection on ESP8266
// see https://github.com/krzychb/EspScopeA0/tree/master/Bravo#results
#ifdef ESP8266
    TimeMs lastReadTime = 0;
#endif

    void evaluate(Context ctx) {
        static_assert(isValidAnalogPort(constant_input_PORT), "must be a valid analog port");

        if (!isInputDirty<input_UPD>(ctx))
            return;

        ::pinMode(constant_input_PORT, INPUT);
#ifdef ESP8266
        if (transactionTime() - lastReadTime > 4) {
            lastReadTime = transactionTime();
            emitValue<output_VAL>(ctx, ::analogRead(constant_input_PORT) / 1023.);
        }
#else
        emitValue<output_VAL>(ctx, ::analogRead(constant_input_PORT) / 1023.);
#endif
        emitValue<output_DONE>(ctx, 1);
    }

};
} // namespace xod__gpio__analog_read
} // namespace xod

//-----------------------------------------------------------------------------
// xod/gpio/digital-read-pullup implementation
//-----------------------------------------------------------------------------
//#pragma XOD evaluate_on_pin disable
//#pragma XOD evaluate_on_pin enable input_UPD

namespace xod {
namespace xod__gpio__digital_read_pullup {
template <uint8_t constant_input_PORT>
struct Node {

    typedef uint8_t typeof_PORT;
    typedef Pulse typeof_UPD;

    typedef Logic typeof_SIG;
    typedef Pulse typeof_DONE;

    struct input_PORT { };
    struct input_UPD { };
    struct output_SIG { };
    struct output_DONE { };

    static const identity<typeof_PORT> getValueType(input_PORT) {
      return identity<typeof_PORT>();
    }
    static const identity<typeof_UPD> getValueType(input_UPD) {
      return identity<typeof_UPD>();
    }
    static const identity<typeof_SIG> getValueType(output_SIG) {
      return identity<typeof_SIG>();
    }
    static const identity<typeof_DONE> getValueType(output_DONE) {
      return identity<typeof_DONE>();
    }

    typeof_SIG _output_SIG;

    Node (typeof_SIG output_SIG) {
        _output_SIG = output_SIG;
    }

    struct ContextObject {

        bool _isInputDirty_UPD;

        bool _isOutputDirty_SIG : 1;
        bool _isOutputDirty_DONE : 1;
    };

    using Context = ContextObject*;

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_PORT input_UPD" \
                " output_SIG output_DONE");
    }

    typeof_PORT getValue(Context ctx, identity<input_PORT>) {
        return constant_input_PORT;
    }
    typeof_UPD getValue(Context ctx, identity<input_UPD>) {
        return Pulse();
    }
    typeof_SIG getValue(Context ctx, identity<output_SIG>) {
        return this->_output_SIG;
    }
    typeof_DONE getValue(Context ctx, identity<output_DONE>) {
        return Pulse();
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                " input_UPD");
        return false;
    }

    bool isInputDirty(Context ctx, identity<input_UPD>) {
        return ctx->_isInputDirty_UPD;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_SIG output_DONE");
    }

    void emitValue(Context ctx, typeof_SIG val, identity<output_SIG>) {
        this->_output_SIG = val;
        ctx->_isOutputDirty_SIG = true;
    }
    void emitValue(Context ctx, typeof_DONE val, identity<output_DONE>) {
        ctx->_isOutputDirty_DONE = true;
    }

    void evaluate(Context ctx) {
        static_assert(isValidDigitalPort(constant_input_PORT), "must be a valid digital port");

        if (!isInputDirty<input_UPD>(ctx))
            return;

        ::pinMode(constant_input_PORT, INPUT_PULLUP);
        emitValue<output_SIG>(ctx, ::digitalRead(constant_input_PORT));
        emitValue<output_DONE>(ctx, 1);
    }

};
} // namespace xod__gpio__digital_read_pullup
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/subtract implementation
//-----------------------------------------------------------------------------
//#pragma XOD dirtieness disable

namespace xod {
namespace xod__core__subtract {
struct Node {

    typedef Number typeof_IN1;
    typedef Number typeof_IN2;

    typedef Number typeof_OUT;

    struct input_IN1 { };
    struct input_IN2 { };
    struct output_OUT { };

    static const identity<typeof_IN1> getValueType(input_IN1) {
      return identity<typeof_IN1>();
    }
    static const identity<typeof_IN2> getValueType(input_IN2) {
      return identity<typeof_IN2>();
    }
    static const identity<typeof_OUT> getValueType(output_OUT) {
      return identity<typeof_OUT>();
    }

    typeof_OUT _output_OUT;

    Node (typeof_OUT output_OUT) {
        _output_OUT = output_OUT;
    }

    struct ContextObject {

        typeof_IN1 _input_IN1;
        typeof_IN2 _input_IN2;

    };

    using Context = ContextObject*;

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN1 input_IN2" \
                " output_OUT");
    }

    typeof_IN1 getValue(Context ctx, identity<input_IN1>) {
        return ctx->_input_IN1;
    }
    typeof_IN2 getValue(Context ctx, identity<input_IN2>) {
        return ctx->_input_IN2;
    }
    typeof_OUT getValue(Context ctx, identity<output_OUT>) {
        return this->_output_OUT;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, typeof_OUT val, identity<output_OUT>) {
        this->_output_OUT = val;
    }

    void evaluate(Context ctx) {
        auto x = getValue<input_IN1>(ctx);
        auto y = getValue<input_IN2>(ctx);
        emitValue<output_OUT>(ctx, x - y);
    }

};
} // namespace xod__core__subtract
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/any implementation
//-----------------------------------------------------------------------------

namespace xod {
namespace xod__core__any {
struct Node {

    typedef Pulse typeof_IN1;
    typedef Pulse typeof_IN2;

    typedef Pulse typeof_OUT;

    struct input_IN1 { };
    struct input_IN2 { };
    struct output_OUT { };

    static const identity<typeof_IN1> getValueType(input_IN1) {
      return identity<typeof_IN1>();
    }
    static const identity<typeof_IN2> getValueType(input_IN2) {
      return identity<typeof_IN2>();
    }
    static const identity<typeof_OUT> getValueType(output_OUT) {
      return identity<typeof_OUT>();
    }

    Node () {
    }

    struct ContextObject {

        bool _isInputDirty_IN1;
        bool _isInputDirty_IN2;

        bool _isOutputDirty_OUT : 1;
    };

    using Context = ContextObject*;

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN1 input_IN2" \
                " output_OUT");
    }

    typeof_IN1 getValue(Context ctx, identity<input_IN1>) {
        return Pulse();
    }
    typeof_IN2 getValue(Context ctx, identity<input_IN2>) {
        return Pulse();
    }
    typeof_OUT getValue(Context ctx, identity<output_OUT>) {
        return Pulse();
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                " input_IN1 input_IN2");
        return false;
    }

    bool isInputDirty(Context ctx, identity<input_IN1>) {
        return ctx->_isInputDirty_IN1;
    }
    bool isInputDirty(Context ctx, identity<input_IN2>) {
        return ctx->_isInputDirty_IN2;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, typeof_OUT val, identity<output_OUT>) {
        ctx->_isOutputDirty_OUT = true;
    }

    void evaluate(Context ctx) {
        bool p1 = isInputDirty<input_IN1>(ctx);
        bool p2 = isInputDirty<input_IN2>(ctx);
        if (p1 || p2)
            emitValue<output_OUT>(ctx, true);
    }

};
} // namespace xod__core__any
} // namespace xod

//-----------------------------------------------------------------------------
// xod/math/map implementation
//-----------------------------------------------------------------------------
//#pragma XOD dirtieness disable

namespace xod {
namespace xod__math__map {
struct Node {

    typedef Number typeof_X;
    typedef Number typeof_Smin;
    typedef Number typeof_Smax;
    typedef Number typeof_Tmin;
    typedef Number typeof_Tmax;

    typedef Number typeof_OUT;

    struct input_X { };
    struct input_Smin { };
    struct input_Smax { };
    struct input_Tmin { };
    struct input_Tmax { };
    struct output_OUT { };

    static const identity<typeof_X> getValueType(input_X) {
      return identity<typeof_X>();
    }
    static const identity<typeof_Smin> getValueType(input_Smin) {
      return identity<typeof_Smin>();
    }
    static const identity<typeof_Smax> getValueType(input_Smax) {
      return identity<typeof_Smax>();
    }
    static const identity<typeof_Tmin> getValueType(input_Tmin) {
      return identity<typeof_Tmin>();
    }
    static const identity<typeof_Tmax> getValueType(input_Tmax) {
      return identity<typeof_Tmax>();
    }
    static const identity<typeof_OUT> getValueType(output_OUT) {
      return identity<typeof_OUT>();
    }

    typeof_OUT _output_OUT;

    Node (typeof_OUT output_OUT) {
        _output_OUT = output_OUT;
    }

    struct ContextObject {

        typeof_X _input_X;
        typeof_Smin _input_Smin;
        typeof_Smax _input_Smax;
        typeof_Tmin _input_Tmin;
        typeof_Tmax _input_Tmax;

    };

    using Context = ContextObject*;

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_X input_Smin input_Smax input_Tmin input_Tmax" \
                " output_OUT");
    }

    typeof_X getValue(Context ctx, identity<input_X>) {
        return ctx->_input_X;
    }
    typeof_Smin getValue(Context ctx, identity<input_Smin>) {
        return ctx->_input_Smin;
    }
    typeof_Smax getValue(Context ctx, identity<input_Smax>) {
        return ctx->_input_Smax;
    }
    typeof_Tmin getValue(Context ctx, identity<input_Tmin>) {
        return ctx->_input_Tmin;
    }
    typeof_Tmax getValue(Context ctx, identity<input_Tmax>) {
        return ctx->_input_Tmax;
    }
    typeof_OUT getValue(Context ctx, identity<output_OUT>) {
        return this->_output_OUT;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, typeof_OUT val, identity<output_OUT>) {
        this->_output_OUT = val;
    }

    void evaluate(Context ctx) {
        auto x = getValue<input_X>(ctx);
        auto sMin = getValue<input_Smin>(ctx);
        auto sMax = getValue<input_Smax>(ctx);
        auto tMin = getValue<input_Tmin>(ctx);
        auto tMax = getValue<input_Tmax>(ctx);
        auto k = (x - sMin) / (sMax - sMin);
        auto xm = isnan(x) ? x : tMin + k * (tMax - tMin);
        emitValue<output_OUT>(ctx, xm);
    }

};
} // namespace xod__math__map
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/not implementation
//-----------------------------------------------------------------------------
//#pragma XOD dirtieness disable

namespace xod {
namespace xod__core__not {
struct Node {

    typedef Logic typeof_IN;

    typedef Logic typeof_OUT;

    struct input_IN { };
    struct output_OUT { };

    static const identity<typeof_IN> getValueType(input_IN) {
      return identity<typeof_IN>();
    }
    static const identity<typeof_OUT> getValueType(output_OUT) {
      return identity<typeof_OUT>();
    }

    typeof_OUT _output_OUT;

    Node (typeof_OUT output_OUT) {
        _output_OUT = output_OUT;
    }

    struct ContextObject {

        typeof_IN _input_IN;

    };

    using Context = ContextObject*;

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN" \
                " output_OUT");
    }

    typeof_IN getValue(Context ctx, identity<input_IN>) {
        return ctx->_input_IN;
    }
    typeof_OUT getValue(Context ctx, identity<output_OUT>) {
        return this->_output_OUT;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, typeof_OUT val, identity<output_OUT>) {
        this->_output_OUT = val;
    }

    void evaluate(Context ctx) {
        auto x = getValue<input_IN>(ctx);
        emitValue<output_OUT>(ctx, !x);
    }

};
} // namespace xod__core__not
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/less implementation
//-----------------------------------------------------------------------------
//#pragma XOD dirtieness disable

namespace xod {
namespace xod__core__less {
struct Node {

    typedef Number typeof_IN1;
    typedef Number typeof_IN2;

    typedef Logic typeof_OUT;

    struct input_IN1 { };
    struct input_IN2 { };
    struct output_OUT { };

    static const identity<typeof_IN1> getValueType(input_IN1) {
      return identity<typeof_IN1>();
    }
    static const identity<typeof_IN2> getValueType(input_IN2) {
      return identity<typeof_IN2>();
    }
    static const identity<typeof_OUT> getValueType(output_OUT) {
      return identity<typeof_OUT>();
    }

    typeof_OUT _output_OUT;

    Node (typeof_OUT output_OUT) {
        _output_OUT = output_OUT;
    }

    struct ContextObject {

        typeof_IN1 _input_IN1;
        typeof_IN2 _input_IN2;

    };

    using Context = ContextObject*;

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN1 input_IN2" \
                " output_OUT");
    }

    typeof_IN1 getValue(Context ctx, identity<input_IN1>) {
        return ctx->_input_IN1;
    }
    typeof_IN2 getValue(Context ctx, identity<input_IN2>) {
        return ctx->_input_IN2;
    }
    typeof_OUT getValue(Context ctx, identity<output_OUT>) {
        return this->_output_OUT;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, typeof_OUT val, identity<output_OUT>) {
        this->_output_OUT = val;
    }

    void evaluate(Context ctx) {
        auto lhs = getValue<input_IN1>(ctx);
        auto rhs = getValue<input_IN2>(ctx);
        emitValue<output_OUT>(ctx, lhs < rhs);
    }

};
} // namespace xod__core__less
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/cast-to-string(number) implementation
//-----------------------------------------------------------------------------
//#pragma XOD dirtieness disable

namespace xod {
namespace xod__core__cast_to_string__number {
struct Node {

    typedef Number typeof_IN;

    typedef XString typeof_OUT;

    struct input_IN { };
    struct output_OUT { };

    static const identity<typeof_IN> getValueType(input_IN) {
      return identity<typeof_IN>();
    }
    static const identity<typeof_OUT> getValueType(output_OUT) {
      return identity<typeof_OUT>();
    }

    typeof_OUT _output_OUT;

    Node (typeof_OUT output_OUT) {
        _output_OUT = output_OUT;
    }

    struct ContextObject {

        typeof_IN _input_IN;

    };

    using Context = ContextObject*;

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN" \
                " output_OUT");
    }

    typeof_IN getValue(Context ctx, identity<input_IN>) {
        return ctx->_input_IN;
    }
    typeof_OUT getValue(Context ctx, identity<output_OUT>) {
        return this->_output_OUT;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, typeof_OUT val, identity<output_OUT>) {
        this->_output_OUT = val;
    }

    char str[16];
    CStringView view = CStringView(str);

    void evaluate(Context ctx) {
        auto num = getValue<input_IN>(ctx);
        formatNumber(num, 2, str);
        emitValue<output_OUT>(ctx, XString(&view));
    }

};
} // namespace xod__core__cast_to_string__number
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/debounce(boolean) implementation
//-----------------------------------------------------------------------------
namespace xod {
namespace xod__core__debounce__boolean {
struct Node {

    typedef Logic typeof_ST;
    typedef Number typeof_Ts;

    typedef Logic typeof_OUT;

    struct input_ST { };
    struct input_Ts { };
    struct output_OUT { };

    static const identity<typeof_ST> getValueType(input_ST) {
      return identity<typeof_ST>();
    }
    static const identity<typeof_Ts> getValueType(input_Ts) {
      return identity<typeof_Ts>();
    }
    static const identity<typeof_OUT> getValueType(output_OUT) {
      return identity<typeof_OUT>();
    }

    TimeMs timeoutAt = 0;

    typeof_OUT _output_OUT;

    Node (typeof_OUT output_OUT) {
        _output_OUT = output_OUT;
    }

    struct ContextObject {

        typeof_ST _input_ST;
        typeof_Ts _input_Ts;

        bool _isOutputDirty_OUT : 1;
    };

    using Context = ContextObject*;

    void setTimeout(__attribute__((unused)) Context ctx, TimeMs timeout) {
        this->timeoutAt = transactionTime() + timeout;
    }

    void clearTimeout(__attribute__((unused)) Context ctx) {
        detail::clearTimeout(this);
    }

    bool isTimedOut(__attribute__((unused)) const Context ctx) {
        return detail::isTimedOut(this);
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_ST input_Ts" \
                " output_OUT");
    }

    typeof_ST getValue(Context ctx, identity<input_ST>) {
        return ctx->_input_ST;
    }
    typeof_Ts getValue(Context ctx, identity<input_Ts>) {
        return ctx->_input_Ts;
    }
    typeof_OUT getValue(Context ctx, identity<output_OUT>) {
        return this->_output_OUT;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, typeof_OUT val, identity<output_OUT>) {
        this->_output_OUT = val;
        ctx->_isOutputDirty_OUT = true;
    }

    bool state = false;

    void evaluate(Context ctx) {
        bool x = getValue<input_ST>(ctx);

        if (x != state) {
            state = x;
            TimeMs dt = getValue<input_Ts>(ctx) * 1000;
            setTimeout(ctx, dt);
        }

        if (isTimedOut(ctx)) {
            emitValue<output_OUT>(ctx, x);
        }
    }

};
} // namespace xod__core__debounce__boolean
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/greater implementation
//-----------------------------------------------------------------------------
//#pragma XOD dirtieness disable

namespace xod {
namespace xod__core__greater {
struct Node {

    typedef Number typeof_IN1;
    typedef Number typeof_IN2;

    typedef Logic typeof_OUT;

    struct input_IN1 { };
    struct input_IN2 { };
    struct output_OUT { };

    static const identity<typeof_IN1> getValueType(input_IN1) {
      return identity<typeof_IN1>();
    }
    static const identity<typeof_IN2> getValueType(input_IN2) {
      return identity<typeof_IN2>();
    }
    static const identity<typeof_OUT> getValueType(output_OUT) {
      return identity<typeof_OUT>();
    }

    typeof_OUT _output_OUT;

    Node (typeof_OUT output_OUT) {
        _output_OUT = output_OUT;
    }

    struct ContextObject {

        typeof_IN1 _input_IN1;
        typeof_IN2 _input_IN2;

    };

    using Context = ContextObject*;

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN1 input_IN2" \
                " output_OUT");
    }

    typeof_IN1 getValue(Context ctx, identity<input_IN1>) {
        return ctx->_input_IN1;
    }
    typeof_IN2 getValue(Context ctx, identity<input_IN2>) {
        return ctx->_input_IN2;
    }
    typeof_OUT getValue(Context ctx, identity<output_OUT>) {
        return this->_output_OUT;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, typeof_OUT val, identity<output_OUT>) {
        this->_output_OUT = val;
    }

    void evaluate(Context ctx) {
        auto lhs = getValue<input_IN1>(ctx);
        auto rhs = getValue<input_IN2>(ctx);
        emitValue<output_OUT>(ctx, lhs > rhs);
    }

};
} // namespace xod__core__greater
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/gate(pulse) implementation
//-----------------------------------------------------------------------------

namespace xod {
namespace xod__core__gate__pulse {
struct Node {

    typedef Pulse typeof_IN;
    typedef Logic typeof_EN;

    typedef Pulse typeof_OUT;

    struct input_IN { };
    struct input_EN { };
    struct output_OUT { };

    static const identity<typeof_IN> getValueType(input_IN) {
      return identity<typeof_IN>();
    }
    static const identity<typeof_EN> getValueType(input_EN) {
      return identity<typeof_EN>();
    }
    static const identity<typeof_OUT> getValueType(output_OUT) {
      return identity<typeof_OUT>();
    }

    Node () {
    }

    struct ContextObject {

        typeof_EN _input_EN;

        bool _isInputDirty_IN;

        bool _isOutputDirty_OUT : 1;
    };

    using Context = ContextObject*;

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN input_EN" \
                " output_OUT");
    }

    typeof_IN getValue(Context ctx, identity<input_IN>) {
        return Pulse();
    }
    typeof_EN getValue(Context ctx, identity<input_EN>) {
        return ctx->_input_EN;
    }
    typeof_OUT getValue(Context ctx, identity<output_OUT>) {
        return Pulse();
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                " input_IN");
        return false;
    }

    bool isInputDirty(Context ctx, identity<input_IN>) {
        return ctx->_isInputDirty_IN;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, typeof_OUT val, identity<output_OUT>) {
        ctx->_isOutputDirty_OUT = true;
    }

    void evaluate(Context ctx) {
        if (getValue<input_EN>(ctx) && isInputDirty<input_IN>(ctx))
            emitValue<output_OUT>(ctx, true);
    }

};
} // namespace xod__core__gate__pulse
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/if-else(number) implementation
//-----------------------------------------------------------------------------
//#pragma XOD dirtieness disable

namespace xod {
namespace xod__core__if_else__number {
struct Node {

    typedef Logic typeof_COND;
    typedef Number typeof_T;
    typedef Number typeof_F;

    typedef Number typeof_R;

    struct input_COND { };
    struct input_T { };
    struct input_F { };
    struct output_R { };

    static const identity<typeof_COND> getValueType(input_COND) {
      return identity<typeof_COND>();
    }
    static const identity<typeof_T> getValueType(input_T) {
      return identity<typeof_T>();
    }
    static const identity<typeof_F> getValueType(input_F) {
      return identity<typeof_F>();
    }
    static const identity<typeof_R> getValueType(output_R) {
      return identity<typeof_R>();
    }

    typeof_R _output_R;

    Node (typeof_R output_R) {
        _output_R = output_R;
    }

    struct ContextObject {

        typeof_COND _input_COND;
        typeof_T _input_T;
        typeof_F _input_F;

    };

    using Context = ContextObject*;

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_COND input_T input_F" \
                " output_R");
    }

    typeof_COND getValue(Context ctx, identity<input_COND>) {
        return ctx->_input_COND;
    }
    typeof_T getValue(Context ctx, identity<input_T>) {
        return ctx->_input_T;
    }
    typeof_F getValue(Context ctx, identity<input_F>) {
        return ctx->_input_F;
    }
    typeof_R getValue(Context ctx, identity<output_R>) {
        return this->_output_R;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_R");
    }

    void emitValue(Context ctx, typeof_R val, identity<output_R>) {
        this->_output_R = val;
    }

    void evaluate(Context ctx) {
        auto cond = getValue<input_COND>(ctx);
        auto trueVal = getValue<input_T>(ctx);
        auto falseVal = getValue<input_F>(ctx);
        emitValue<output_R>(ctx, cond ? trueVal : falseVal);
    }

};
} // namespace xod__core__if_else__number
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/concat implementation
//-----------------------------------------------------------------------------
//#pragma XOD dirtieness disable

namespace xod {
namespace xod__core__concat {
struct Node {

    typedef XString typeof_IN1;
    typedef XString typeof_IN2;

    typedef XString typeof_OUT;

    struct input_IN1 { };
    struct input_IN2 { };
    struct output_OUT { };

    static const identity<typeof_IN1> getValueType(input_IN1) {
      return identity<typeof_IN1>();
    }
    static const identity<typeof_IN2> getValueType(input_IN2) {
      return identity<typeof_IN2>();
    }
    static const identity<typeof_OUT> getValueType(output_OUT) {
      return identity<typeof_OUT>();
    }

    typeof_OUT _output_OUT;

    Node (typeof_OUT output_OUT) {
        _output_OUT = output_OUT;
    }

    struct ContextObject {

        typeof_IN1 _input_IN1;
        typeof_IN2 _input_IN2;

    };

    using Context = ContextObject*;

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN1 input_IN2" \
                " output_OUT");
    }

    typeof_IN1 getValue(Context ctx, identity<input_IN1>) {
        return ctx->_input_IN1;
    }
    typeof_IN2 getValue(Context ctx, identity<input_IN2>) {
        return ctx->_input_IN2;
    }
    typeof_OUT getValue(Context ctx, identity<output_OUT>) {
        return this->_output_OUT;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, typeof_OUT val, identity<output_OUT>) {
        this->_output_OUT = val;
    }

    ConcatListView<char> view;

    void evaluate(Context ctx) {
        auto head = getValue<input_IN1>(ctx);
        auto tail = getValue<input_IN2>(ctx);
        view = ConcatListView<char>(head, tail);
        emitValue<output_OUT>(ctx, XString(&view));
    }

};
} // namespace xod__core__concat
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/pulse-on-true implementation
//-----------------------------------------------------------------------------

namespace xod {
namespace xod__core__pulse_on_true {
struct Node {

    typedef Logic typeof_IN;

    typedef Pulse typeof_OUT;

    struct input_IN { };
    struct output_OUT { };

    static const identity<typeof_IN> getValueType(input_IN) {
      return identity<typeof_IN>();
    }
    static const identity<typeof_OUT> getValueType(output_OUT) {
      return identity<typeof_OUT>();
    }

    Node () {
    }

    struct ContextObject {

        typeof_IN _input_IN;

        bool _isOutputDirty_OUT : 1;
    };

    using Context = ContextObject*;

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN" \
                " output_OUT");
    }

    typeof_IN getValue(Context ctx, identity<input_IN>) {
        return ctx->_input_IN;
    }
    typeof_OUT getValue(Context ctx, identity<output_OUT>) {
        return Pulse();
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, typeof_OUT val, identity<output_OUT>) {
        ctx->_isOutputDirty_OUT = true;
    }

    bool state = false;

    void evaluate(Context ctx) {
        auto newValue = getValue<input_IN>(ctx);

        if (!isSettingUp() && newValue == true && state == false)
            emitValue<output_OUT>(ctx, 1);

        state = newValue;
    }

};
} // namespace xod__core__pulse_on_true
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/and implementation
//-----------------------------------------------------------------------------
//#pragma XOD dirtieness disable

namespace xod {
namespace xod__core__and {
struct Node {

    typedef Logic typeof_IN1;
    typedef Logic typeof_IN2;

    typedef Logic typeof_OUT;

    struct input_IN1 { };
    struct input_IN2 { };
    struct output_OUT { };

    static const identity<typeof_IN1> getValueType(input_IN1) {
      return identity<typeof_IN1>();
    }
    static const identity<typeof_IN2> getValueType(input_IN2) {
      return identity<typeof_IN2>();
    }
    static const identity<typeof_OUT> getValueType(output_OUT) {
      return identity<typeof_OUT>();
    }

    typeof_OUT _output_OUT;

    Node (typeof_OUT output_OUT) {
        _output_OUT = output_OUT;
    }

    struct ContextObject {

        typeof_IN1 _input_IN1;
        typeof_IN2 _input_IN2;

    };

    using Context = ContextObject*;

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN1 input_IN2" \
                " output_OUT");
    }

    typeof_IN1 getValue(Context ctx, identity<input_IN1>) {
        return ctx->_input_IN1;
    }
    typeof_IN2 getValue(Context ctx, identity<input_IN2>) {
        return ctx->_input_IN2;
    }
    typeof_OUT getValue(Context ctx, identity<output_OUT>) {
        return this->_output_OUT;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, typeof_OUT val, identity<output_OUT>) {
        this->_output_OUT = val;
    }

    void evaluate(Context ctx) {
        auto a = getValue<input_IN1>(ctx);
        auto b = getValue<input_IN2>(ctx);
        emitValue<output_OUT>(ctx, a && b);
    }

};
} // namespace xod__core__and
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/if-else(string) implementation
//-----------------------------------------------------------------------------
//#pragma XOD dirtieness disable

namespace xod {
namespace xod__core__if_else__string {
struct Node {

    typedef Logic typeof_COND;
    typedef XString typeof_T;
    typedef XString typeof_F;

    typedef XString typeof_R;

    struct input_COND { };
    struct input_T { };
    struct input_F { };
    struct output_R { };

    static const identity<typeof_COND> getValueType(input_COND) {
      return identity<typeof_COND>();
    }
    static const identity<typeof_T> getValueType(input_T) {
      return identity<typeof_T>();
    }
    static const identity<typeof_F> getValueType(input_F) {
      return identity<typeof_F>();
    }
    static const identity<typeof_R> getValueType(output_R) {
      return identity<typeof_R>();
    }

    typeof_R _output_R;

    Node (typeof_R output_R) {
        _output_R = output_R;
    }

    struct ContextObject {

        typeof_COND _input_COND;
        typeof_T _input_T;
        typeof_F _input_F;

    };

    using Context = ContextObject*;

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_COND input_T input_F" \
                " output_R");
    }

    typeof_COND getValue(Context ctx, identity<input_COND>) {
        return ctx->_input_COND;
    }
    typeof_T getValue(Context ctx, identity<input_T>) {
        return ctx->_input_T;
    }
    typeof_F getValue(Context ctx, identity<input_F>) {
        return ctx->_input_F;
    }
    typeof_R getValue(Context ctx, identity<output_R>) {
        return this->_output_R;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_R");
    }

    void emitValue(Context ctx, typeof_R val, identity<output_R>) {
        this->_output_R = val;
    }

    void evaluate(Context ctx) {
        auto cond = getValue<input_COND>(ctx);
        auto trueVal = getValue<input_T>(ctx);
        auto falseVal = getValue<input_F>(ctx);
        emitValue<output_R>(ctx, cond ? trueVal : falseVal);
    }

};
} // namespace xod__core__if_else__string
} // namespace xod

//-----------------------------------------------------------------------------
// xod-dev/text-lcd/set-backlight implementation
//-----------------------------------------------------------------------------

namespace xod {
namespace xod_dev__text_lcd__set_backlight {
struct Node {

    typedef xod_dev__text_lcd__text_lcd_i2c_device::Node::Type typeof_DEV;
    typedef Logic typeof_BL;
    typedef Pulse typeof_DO;

    typedef xod_dev__text_lcd__text_lcd_i2c_device::Node::Type typeof_DEVU0027;
    typedef Pulse typeof_DONE;

    struct input_DEV { };
    struct input_BL { };
    struct input_DO { };
    struct output_DEVU0027 { };
    struct output_DONE { };

    static const identity<typeof_DEV> getValueType(input_DEV) {
      return identity<typeof_DEV>();
    }
    static const identity<typeof_BL> getValueType(input_BL) {
      return identity<typeof_BL>();
    }
    static const identity<typeof_DO> getValueType(input_DO) {
      return identity<typeof_DO>();
    }
    static const identity<typeof_DEVU0027> getValueType(output_DEVU0027) {
      return identity<typeof_DEVU0027>();
    }
    static const identity<typeof_DONE> getValueType(output_DONE) {
      return identity<typeof_DONE>();
    }

    typeof_DEVU0027 _output_DEVU0027;

    Node (typeof_DEVU0027 output_DEVU0027) {
        _output_DEVU0027 = output_DEVU0027;
    }

    struct ContextObject {

        typeof_DEV _input_DEV;
        typeof_BL _input_BL;

        bool _isInputDirty_DO;

        bool _isOutputDirty_DEVU0027 : 1;
        bool _isOutputDirty_DONE : 1;
    };

    using Context = ContextObject*;

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_DEV input_BL input_DO" \
                " output_DEVU0027 output_DONE");
    }

    typeof_DEV getValue(Context ctx, identity<input_DEV>) {
        return ctx->_input_DEV;
    }
    typeof_BL getValue(Context ctx, identity<input_BL>) {
        return ctx->_input_BL;
    }
    typeof_DO getValue(Context ctx, identity<input_DO>) {
        return Pulse();
    }
    typeof_DEVU0027 getValue(Context ctx, identity<output_DEVU0027>) {
        return this->_output_DEVU0027;
    }
    typeof_DONE getValue(Context ctx, identity<output_DONE>) {
        return Pulse();
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                " input_DO");
        return false;
    }

    bool isInputDirty(Context ctx, identity<input_DO>) {
        return ctx->_isInputDirty_DO;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_DEVU0027 output_DONE");
    }

    void emitValue(Context ctx, typeof_DEVU0027 val, identity<output_DEVU0027>) {
        this->_output_DEVU0027 = val;
        ctx->_isOutputDirty_DEVU0027 = true;
    }
    void emitValue(Context ctx, typeof_DONE val, identity<output_DONE>) {
        ctx->_isOutputDirty_DONE = true;
    }

    void evaluate(Context ctx) {
        auto t = getValue<input_DEV>(ctx);
        if (isInputDirty<input_DO>(ctx)) {
            t.lcd->setBacklight(getValue<input_BL>(ctx));
            emitValue<output_DONE>(ctx, 1);
        }

        emitValue<output_DEVU0027>(ctx, t);
    }

};
} // namespace xod_dev__text_lcd__set_backlight
} // namespace xod

//-----------------------------------------------------------------------------
// xod/math/cube implementation
//-----------------------------------------------------------------------------
//#pragma XOD dirtieness disable

namespace xod {
namespace xod__math__cube {
struct Node {

    typedef Number typeof_IN;

    typedef Number typeof_OUT;

    struct input_IN { };
    struct output_OUT { };

    static const identity<typeof_IN> getValueType(input_IN) {
      return identity<typeof_IN>();
    }
    static const identity<typeof_OUT> getValueType(output_OUT) {
      return identity<typeof_OUT>();
    }

    typeof_OUT _output_OUT;

    Node (typeof_OUT output_OUT) {
        _output_OUT = output_OUT;
    }

    struct ContextObject {

        typeof_IN _input_IN;

    };

    using Context = ContextObject*;

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN" \
                " output_OUT");
    }

    typeof_IN getValue(Context ctx, identity<input_IN>) {
        return ctx->_input_IN;
    }
    typeof_OUT getValue(Context ctx, identity<output_OUT>) {
        return this->_output_OUT;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, typeof_OUT val, identity<output_OUT>) {
        this->_output_OUT = val;
    }

    void evaluate(Context ctx) {
        Number x = getValue<input_IN>(ctx);
        emitValue<output_OUT>(ctx, x * x * x);
    }

};
} // namespace xod__math__cube
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/pulse-on-change(number) implementation
//-----------------------------------------------------------------------------

namespace xod {
namespace xod__core__pulse_on_change__number {
struct Node {

    typedef Number typeof_IN;

    typedef Pulse typeof_OUT;

    struct input_IN { };
    struct output_OUT { };

    static const identity<typeof_IN> getValueType(input_IN) {
      return identity<typeof_IN>();
    }
    static const identity<typeof_OUT> getValueType(output_OUT) {
      return identity<typeof_OUT>();
    }

    Node () {
    }

    struct ContextObject {

        typeof_IN _input_IN;

        bool _isOutputDirty_OUT : 1;
    };

    using Context = ContextObject*;

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN" \
                " output_OUT");
    }

    typeof_IN getValue(Context ctx, identity<input_IN>) {
        return ctx->_input_IN;
    }
    typeof_OUT getValue(Context ctx, identity<output_OUT>) {
        return Pulse();
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, typeof_OUT val, identity<output_OUT>) {
        ctx->_isOutputDirty_OUT = true;
    }

    Number sample = NAN;

    void evaluate(Context ctx) {
        auto newValue = getValue<input_IN>(ctx);

        if (!isSettingUp() && newValue != sample)
            emitValue<output_OUT>(ctx, 1);

        sample = newValue;
    }

};
} // namespace xod__core__pulse_on_change__number
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/flip-flop implementation
//-----------------------------------------------------------------------------

namespace xod {
namespace xod__core__flip_flop {
struct Node {

    typedef Pulse typeof_SET;
    typedef Pulse typeof_TGL;
    typedef Pulse typeof_RST;

    typedef Logic typeof_MEM;

    struct input_SET { };
    struct input_TGL { };
    struct input_RST { };
    struct output_MEM { };

    static const identity<typeof_SET> getValueType(input_SET) {
      return identity<typeof_SET>();
    }
    static const identity<typeof_TGL> getValueType(input_TGL) {
      return identity<typeof_TGL>();
    }
    static const identity<typeof_RST> getValueType(input_RST) {
      return identity<typeof_RST>();
    }
    static const identity<typeof_MEM> getValueType(output_MEM) {
      return identity<typeof_MEM>();
    }

    typeof_MEM _output_MEM;

    Node (typeof_MEM output_MEM) {
        _output_MEM = output_MEM;
    }

    struct ContextObject {

        bool _isInputDirty_SET;
        bool _isInputDirty_TGL;
        bool _isInputDirty_RST;

        bool _isOutputDirty_MEM : 1;
    };

    using Context = ContextObject*;

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_SET input_TGL input_RST" \
                " output_MEM");
    }

    typeof_SET getValue(Context ctx, identity<input_SET>) {
        return Pulse();
    }
    typeof_TGL getValue(Context ctx, identity<input_TGL>) {
        return Pulse();
    }
    typeof_RST getValue(Context ctx, identity<input_RST>) {
        return Pulse();
    }
    typeof_MEM getValue(Context ctx, identity<output_MEM>) {
        return this->_output_MEM;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                " input_SET input_TGL input_RST");
        return false;
    }

    bool isInputDirty(Context ctx, identity<input_SET>) {
        return ctx->_isInputDirty_SET;
    }
    bool isInputDirty(Context ctx, identity<input_TGL>) {
        return ctx->_isInputDirty_TGL;
    }
    bool isInputDirty(Context ctx, identity<input_RST>) {
        return ctx->_isInputDirty_RST;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_MEM");
    }

    void emitValue(Context ctx, typeof_MEM val, identity<output_MEM>) {
        this->_output_MEM = val;
        ctx->_isOutputDirty_MEM = true;
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

};
} // namespace xod__core__flip_flop
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/or implementation
//-----------------------------------------------------------------------------
//#pragma XOD dirtieness disable

namespace xod {
namespace xod__core__or {
struct Node {

    typedef Logic typeof_IN1;
    typedef Logic typeof_IN2;

    typedef Logic typeof_OUT;

    struct input_IN1 { };
    struct input_IN2 { };
    struct output_OUT { };

    static const identity<typeof_IN1> getValueType(input_IN1) {
      return identity<typeof_IN1>();
    }
    static const identity<typeof_IN2> getValueType(input_IN2) {
      return identity<typeof_IN2>();
    }
    static const identity<typeof_OUT> getValueType(output_OUT) {
      return identity<typeof_OUT>();
    }

    typeof_OUT _output_OUT;

    Node (typeof_OUT output_OUT) {
        _output_OUT = output_OUT;
    }

    struct ContextObject {

        typeof_IN1 _input_IN1;
        typeof_IN2 _input_IN2;

    };

    using Context = ContextObject*;

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN1 input_IN2" \
                " output_OUT");
    }

    typeof_IN1 getValue(Context ctx, identity<input_IN1>) {
        return ctx->_input_IN1;
    }
    typeof_IN2 getValue(Context ctx, identity<input_IN2>) {
        return ctx->_input_IN2;
    }
    typeof_OUT getValue(Context ctx, identity<output_OUT>) {
        return this->_output_OUT;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, typeof_OUT val, identity<output_OUT>) {
        this->_output_OUT = val;
    }

    void evaluate(Context ctx) {
        auto a = getValue<input_IN1>(ctx);
        auto b = getValue<input_IN2>(ctx);
        emitValue<output_OUT>(ctx, a || b);
    }

};
} // namespace xod__core__or
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/clock implementation
//-----------------------------------------------------------------------------

namespace xod {
namespace xod__core__clock {
struct Node {

    typedef Logic typeof_EN;
    typedef Number typeof_IVAL;
    typedef Pulse typeof_RST;

    typedef Pulse typeof_TICK;

    struct input_EN { };
    struct input_IVAL { };
    struct input_RST { };
    struct output_TICK { };

    static const identity<typeof_EN> getValueType(input_EN) {
      return identity<typeof_EN>();
    }
    static const identity<typeof_IVAL> getValueType(input_IVAL) {
      return identity<typeof_IVAL>();
    }
    static const identity<typeof_RST> getValueType(input_RST) {
      return identity<typeof_RST>();
    }
    static const identity<typeof_TICK> getValueType(output_TICK) {
      return identity<typeof_TICK>();
    }

    TimeMs timeoutAt = 0;

    Node () {
    }

    struct ContextObject {

        typeof_EN _input_EN;
        typeof_IVAL _input_IVAL;

        bool _isInputDirty_EN;
        bool _isInputDirty_RST;

        bool _isOutputDirty_TICK : 1;
    };

    using Context = ContextObject*;

    void setTimeout(__attribute__((unused)) Context ctx, TimeMs timeout) {
        this->timeoutAt = transactionTime() + timeout;
    }

    void clearTimeout(__attribute__((unused)) Context ctx) {
        detail::clearTimeout(this);
    }

    bool isTimedOut(__attribute__((unused)) const Context ctx) {
        return detail::isTimedOut(this);
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_EN input_IVAL input_RST" \
                " output_TICK");
    }

    typeof_EN getValue(Context ctx, identity<input_EN>) {
        return ctx->_input_EN;
    }
    typeof_IVAL getValue(Context ctx, identity<input_IVAL>) {
        return ctx->_input_IVAL;
    }
    typeof_RST getValue(Context ctx, identity<input_RST>) {
        return Pulse();
    }
    typeof_TICK getValue(Context ctx, identity<output_TICK>) {
        return Pulse();
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                " input_EN input_RST");
        return false;
    }

    bool isInputDirty(Context ctx, identity<input_EN>) {
        return ctx->_isInputDirty_EN;
    }
    bool isInputDirty(Context ctx, identity<input_RST>) {
        return ctx->_isInputDirty_RST;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_TICK");
    }

    void emitValue(Context ctx, typeof_TICK val, identity<output_TICK>) {
        ctx->_isOutputDirty_TICK = true;
    }

    TimeMs nextTrig;

    void evaluate(Context ctx) {
        TimeMs tNow = transactionTime();
        auto ival = getValue<input_IVAL>(ctx);
        if (ival < 0) ival = 0;
        TimeMs dt = ival * 1000;
        TimeMs tNext = tNow + dt;

        auto isEnabled = getValue<input_EN>(ctx);
        auto isRstDirty = isInputDirty<input_RST>(ctx);

        if (isTimedOut(ctx) && isEnabled && !isRstDirty) {
            emitValue<output_TICK>(ctx, 1);
            nextTrig = tNext;
            setTimeout(ctx, dt);
        }

        if (isRstDirty || isInputDirty<input_EN>(ctx)) {
            // Handle enable/disable/reset
            if (!isEnabled) {
                // Disable timeout loop on explicit false on EN
                nextTrig = 0;
                clearTimeout(ctx);
            } else if (nextTrig < tNow || nextTrig > tNext) {
                // Start timeout from scratch
                nextTrig = tNext;
                setTimeout(ctx, dt);
            }
        }
    }

};
} // namespace xod__core__clock
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/if-error(string) implementation
//-----------------------------------------------------------------------------
//#pragma XOD error_raise enable
//#pragma XOD error_catch enable

namespace xod {
namespace xod__core__if_error__string {
struct Node {

    typedef XString typeof_IN;
    typedef XString typeof_DEF;

    typedef XString typeof_OUT;

    struct input_IN { };
    struct input_DEF { };
    struct output_OUT { };

    static const identity<typeof_IN> getValueType(input_IN) {
      return identity<typeof_IN>();
    }
    static const identity<typeof_DEF> getValueType(input_DEF) {
      return identity<typeof_DEF>();
    }
    static const identity<typeof_OUT> getValueType(output_OUT) {
      return identity<typeof_OUT>();
    }

    union NodeErrors {
        struct {
            bool output_OUT : 1;
        };

        ErrorFlags flags = 0;
    };

    NodeErrors errors = {};

    typeof_OUT _output_OUT;

    Node (typeof_OUT output_OUT) {
        _output_OUT = output_OUT;
    }

    struct ContextObject {
        uint8_t _error_input_IN;
        uint8_t _error_input_DEF;

        typeof_IN _input_IN;
        typeof_DEF _input_DEF;

        bool _isOutputDirty_OUT : 1;
    };

    using Context = ContextObject*;

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN input_DEF" \
                " output_OUT");
    }

    typeof_IN getValue(Context ctx, identity<input_IN>) {
        return ctx->_input_IN;
    }
    typeof_DEF getValue(Context ctx, identity<input_DEF>) {
        return ctx->_input_DEF;
    }
    typeof_OUT getValue(Context ctx, identity<output_OUT>) {
        return this->_output_OUT;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, typeof_OUT val, identity<output_OUT>) {
        this->_output_OUT = val;
        ctx->_isOutputDirty_OUT = true;
        this->errors.output_OUT = false;
    }

    template<typename OutputT> void raiseError(Context ctx) {
        raiseError(ctx, identity<OutputT>());
    }

    template<typename OutputT> void raiseError(Context ctx, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void raiseError(Context ctx, identity<output_OUT>) {
        this->errors.output_OUT = true;
        ctx->_isOutputDirty_OUT = true;
    }

    void raiseError(Context ctx) {
        this->errors.output_OUT = true;
        ctx->_isOutputDirty_OUT = true;
    }

    template<typename InputT> uint8_t getError(Context ctx) {
        return getError(ctx, identity<InputT>());
    }

    template<typename InputT> uint8_t getError(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                " input_IN input_DEF");
        return 0;
    }

    uint8_t getError(Context ctx, identity<input_IN>) {
        return ctx->_error_input_IN;
    }
    uint8_t getError(Context ctx, identity<input_DEF>) {
        return ctx->_error_input_DEF;
    }

    void evaluate(Context ctx) {
        auto defError = getError<input_DEF>(ctx);

        if (defError) {
            // "DEF" input should not contain an error — reraise it
            raiseError<output_OUT>(ctx);
        } else {
            emitValue<output_OUT>(ctx, getError<input_IN>(ctx) ? getValue<input_DEF>(ctx) : getValue<input_IN>(ctx));
        }
    }

};
} // namespace xod__core__if_error__string
} // namespace xod

//-----------------------------------------------------------------------------
// xod/gpio/pwm-write implementation
//-----------------------------------------------------------------------------
//#pragma XOD evaluate_on_pin disable
//#pragma XOD evaluate_on_pin enable input_UPD

#ifdef ESP32
#include <analogWrite.h>
#endif

namespace xod {
namespace xod__gpio__pwm_write {
template <uint8_t constant_input_PORT>
struct Node {

    typedef uint8_t typeof_PORT;
    typedef Number typeof_DUTY;
    typedef Pulse typeof_UPD;

    typedef Pulse typeof_DONE;

    struct input_PORT { };
    struct input_DUTY { };
    struct input_UPD { };
    struct output_DONE { };

    static const identity<typeof_PORT> getValueType(input_PORT) {
      return identity<typeof_PORT>();
    }
    static const identity<typeof_DUTY> getValueType(input_DUTY) {
      return identity<typeof_DUTY>();
    }
    static const identity<typeof_UPD> getValueType(input_UPD) {
      return identity<typeof_UPD>();
    }
    static const identity<typeof_DONE> getValueType(output_DONE) {
      return identity<typeof_DONE>();
    }

    Node () {
    }

    struct ContextObject {

        typeof_DUTY _input_DUTY;

        bool _isInputDirty_UPD;

        bool _isOutputDirty_DONE : 1;
    };

    using Context = ContextObject*;

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_PORT input_DUTY input_UPD" \
                " output_DONE");
    }

    typeof_PORT getValue(Context ctx, identity<input_PORT>) {
        return constant_input_PORT;
    }
    typeof_DUTY getValue(Context ctx, identity<input_DUTY>) {
        return ctx->_input_DUTY;
    }
    typeof_UPD getValue(Context ctx, identity<input_UPD>) {
        return Pulse();
    }
    typeof_DONE getValue(Context ctx, identity<output_DONE>) {
        return Pulse();
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                " input_UPD");
        return false;
    }

    bool isInputDirty(Context ctx, identity<input_UPD>) {
        return ctx->_isInputDirty_UPD;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_DONE");
    }

    void emitValue(Context ctx, typeof_DONE val, identity<output_DONE>) {
        ctx->_isOutputDirty_DONE = true;
    }

    #ifdef PWMRANGE
    static constexpr Number pwmRange = PWMRANGE;
    #else
    static constexpr Number pwmRange = 255.0;
    #endif

    void evaluate(Context ctx) {
        static_assert(isValidDigitalPort(constant_input_PORT), "must be a valid digital port");

        if (!isInputDirty<input_UPD>(ctx))
            return;

        auto duty = getValue<input_DUTY>(ctx);
        duty = duty > 1 ? 1 : (duty < 0 ? 0 : duty);
        int val = (int)(duty * pwmRange);

        pinMode(constant_input_PORT, OUTPUT);
        analogWrite(constant_input_PORT, val);

        emitValue<output_DONE>(ctx, 1);
    }

};
} // namespace xod__gpio__pwm_write
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/count implementation
//-----------------------------------------------------------------------------

namespace xod {
namespace xod__core__count {
struct Node {

    typedef Number typeof_STEP;
    typedef Pulse typeof_INC;
    typedef Pulse typeof_RST;

    typedef Number typeof_OUT;

    struct input_STEP { };
    struct input_INC { };
    struct input_RST { };
    struct output_OUT { };

    static const identity<typeof_STEP> getValueType(input_STEP) {
      return identity<typeof_STEP>();
    }
    static const identity<typeof_INC> getValueType(input_INC) {
      return identity<typeof_INC>();
    }
    static const identity<typeof_RST> getValueType(input_RST) {
      return identity<typeof_RST>();
    }
    static const identity<typeof_OUT> getValueType(output_OUT) {
      return identity<typeof_OUT>();
    }

    typeof_OUT _output_OUT;

    Node (typeof_OUT output_OUT) {
        _output_OUT = output_OUT;
    }

    struct ContextObject {

        typeof_STEP _input_STEP;

        bool _isInputDirty_INC;
        bool _isInputDirty_RST;

        bool _isOutputDirty_OUT : 1;
    };

    using Context = ContextObject*;

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_STEP input_INC input_RST" \
                " output_OUT");
    }

    typeof_STEP getValue(Context ctx, identity<input_STEP>) {
        return ctx->_input_STEP;
    }
    typeof_INC getValue(Context ctx, identity<input_INC>) {
        return Pulse();
    }
    typeof_RST getValue(Context ctx, identity<input_RST>) {
        return Pulse();
    }
    typeof_OUT getValue(Context ctx, identity<output_OUT>) {
        return this->_output_OUT;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                " input_INC input_RST");
        return false;
    }

    bool isInputDirty(Context ctx, identity<input_INC>) {
        return ctx->_isInputDirty_INC;
    }
    bool isInputDirty(Context ctx, identity<input_RST>) {
        return ctx->_isInputDirty_RST;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, typeof_OUT val, identity<output_OUT>) {
        this->_output_OUT = val;
        ctx->_isOutputDirty_OUT = true;
    }

    void evaluate(Context ctx) {
        Number count = getValue<output_OUT>(ctx);

        if (isInputDirty<input_RST>(ctx))
            count = 0;
        else if (isInputDirty<input_INC>(ctx))
            count += getValue<input_STEP>(ctx);

        emitValue<output_OUT>(ctx, count);
    }

};
} // namespace xod__core__count
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/square-wave implementation
//-----------------------------------------------------------------------------

namespace xod {
namespace xod__core__square_wave {
struct Node {

    typedef Number typeof_T;
    typedef Number typeof_DUTY;
    typedef Logic typeof_EN;
    typedef Pulse typeof_RST;

    typedef Logic typeof_OUT;
    typedef Number typeof_N;

    struct input_T { };
    struct input_DUTY { };
    struct input_EN { };
    struct input_RST { };
    struct output_OUT { };
    struct output_N { };

    static const identity<typeof_T> getValueType(input_T) {
      return identity<typeof_T>();
    }
    static const identity<typeof_DUTY> getValueType(input_DUTY) {
      return identity<typeof_DUTY>();
    }
    static const identity<typeof_EN> getValueType(input_EN) {
      return identity<typeof_EN>();
    }
    static const identity<typeof_RST> getValueType(input_RST) {
      return identity<typeof_RST>();
    }
    static const identity<typeof_OUT> getValueType(output_OUT) {
      return identity<typeof_OUT>();
    }
    static const identity<typeof_N> getValueType(output_N) {
      return identity<typeof_N>();
    }

    TimeMs timeoutAt = 0;

    typeof_OUT _output_OUT;
    typeof_N _output_N;

    Node (typeof_OUT output_OUT, typeof_N output_N) {
        _output_OUT = output_OUT;
        _output_N = output_N;
    }

    struct ContextObject {

        typeof_T _input_T;
        typeof_DUTY _input_DUTY;
        typeof_EN _input_EN;

        bool _isInputDirty_RST;

        bool _isOutputDirty_OUT : 1;
        bool _isOutputDirty_N : 1;
    };

    using Context = ContextObject*;

    void setTimeout(__attribute__((unused)) Context ctx, TimeMs timeout) {
        this->timeoutAt = transactionTime() + timeout;
    }

    void clearTimeout(__attribute__((unused)) Context ctx) {
        detail::clearTimeout(this);
    }

    bool isTimedOut(__attribute__((unused)) const Context ctx) {
        return detail::isTimedOut(this);
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_T input_DUTY input_EN input_RST" \
                " output_OUT output_N");
    }

    typeof_T getValue(Context ctx, identity<input_T>) {
        return ctx->_input_T;
    }
    typeof_DUTY getValue(Context ctx, identity<input_DUTY>) {
        return ctx->_input_DUTY;
    }
    typeof_EN getValue(Context ctx, identity<input_EN>) {
        return ctx->_input_EN;
    }
    typeof_RST getValue(Context ctx, identity<input_RST>) {
        return Pulse();
    }
    typeof_OUT getValue(Context ctx, identity<output_OUT>) {
        return this->_output_OUT;
    }
    typeof_N getValue(Context ctx, identity<output_N>) {
        return this->_output_N;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                " input_RST");
        return false;
    }

    bool isInputDirty(Context ctx, identity<input_RST>) {
        return ctx->_isInputDirty_RST;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT output_N");
    }

    void emitValue(Context ctx, typeof_OUT val, identity<output_OUT>) {
        this->_output_OUT = val;
        ctx->_isOutputDirty_OUT = true;
    }
    void emitValue(Context ctx, typeof_N val, identity<output_N>) {
        this->_output_N = val;
        ctx->_isOutputDirty_N = true;
    }

    bool wasEnabled;
    TimeMs timeToSwitch;
    TimeMs nextSwitchTime;

    void evaluate(Context ctx) {
        TimeMs t = transactionTime();

        bool enabled = getValue<input_EN>(ctx);
        bool reset = isInputDirty<input_RST>(ctx);
        Number period = getValue<input_T>(ctx);
        Number duty = getValue<input_DUTY>(ctx);

        if (reset) {
            emitValue<output_OUT>(ctx, enabled);
            emitValue<output_N>(ctx, 0);
            clearTimeout(ctx);
            // enforce rescheduling at the next stage if enabled
            wasEnabled = false;
        }

        if (enabled && !wasEnabled) {
            // just enabled/resumed
            timeToSwitch = (period * duty) * 1000.0;
            setTimeout(ctx, timeToSwitch);
            nextSwitchTime = t + timeToSwitch;
            emitValue<output_OUT>(ctx, true);
        } else if (!enabled && wasEnabled) {
            // just paused
            // TODO: we can get rid of storing nextSwitchTime if API would
            // have a function to fetch current scheduled time for a ctx
            timeToSwitch = nextSwitchTime - t;
            clearTimeout(ctx);
        } else if (isTimedOut(ctx)) {
            // switch time
            auto newValue = !getValue<output_OUT>(ctx);
            auto k = newValue ? duty : (1.0 - duty);
            timeToSwitch = period * k * 1000.0;

            setTimeout(ctx, timeToSwitch);
            nextSwitchTime = t + timeToSwitch;

            emitValue<output_OUT>(ctx, newValue);
            if (newValue)
                emitValue<output_N>(ctx, getValue<output_N>(ctx) + 1);
        }

        wasEnabled = enabled;
    }

};
} // namespace xod__core__square_wave
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/pulse-on-change(string) implementation
//-----------------------------------------------------------------------------

namespace xod {
namespace xod__core__pulse_on_change__string {
struct Node {

    typedef XString typeof_IN;

    typedef Pulse typeof_OUT;

    struct input_IN { };
    struct output_OUT { };

    static const identity<typeof_IN> getValueType(input_IN) {
      return identity<typeof_IN>();
    }
    static const identity<typeof_OUT> getValueType(output_OUT) {
      return identity<typeof_OUT>();
    }

    Node () {
    }

    struct ContextObject {

        typeof_IN _input_IN;

        bool _isOutputDirty_OUT : 1;
    };

    using Context = ContextObject*;

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN" \
                " output_OUT");
    }

    typeof_IN getValue(Context ctx, identity<input_IN>) {
        return ctx->_input_IN;
    }
    typeof_OUT getValue(Context ctx, identity<output_OUT>) {
        return Pulse();
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, typeof_OUT val, identity<output_OUT>) {
        ctx->_isOutputDirty_OUT = true;
    }

    uint8_t prev = 0;

    uint8_t crc8(XString str) {
        uint8_t result = 0;
        auto it = str.iterate();

        for (; it; ++it) {
            result ^= *it;

            for (size_t i = 0; i < 8; i++) {
                if (result & 0x80) {
                    result <<= 1;
                    result ^= 0x85; // x8 + x7 + x2 + x0
                } else {
                    result <<= 1;
                }
            }
        }

        return result;
    }

    void evaluate(Context ctx) {
        auto str = getValue<input_IN>(ctx);

        uint8_t current = crc8(str);

        if (!isSettingUp() && current != prev)
            emitValue<output_OUT>(ctx, 1);

        prev = current;
    }

};
} // namespace xod__core__pulse_on_change__string
} // namespace xod
;

//-----------------------------------------------------------------------------
// xod/core/buffer(number) implementation
//-----------------------------------------------------------------------------
//#pragma XOD evaluate_on_pin disable
//#pragma XOD evaluate_on_pin enable input_UPD

namespace xod {
namespace xod__core__buffer__number {
struct Node {

    typedef Number typeof_NEW;
    typedef Pulse typeof_UPD;

    typedef Number typeof_MEM;

    struct input_NEW { };
    struct input_UPD { };
    struct output_MEM { };

    static const identity<typeof_NEW> getValueType(input_NEW) {
      return identity<typeof_NEW>();
    }
    static const identity<typeof_UPD> getValueType(input_UPD) {
      return identity<typeof_UPD>();
    }
    static const identity<typeof_MEM> getValueType(output_MEM) {
      return identity<typeof_MEM>();
    }

    typeof_MEM _output_MEM;

    Node (typeof_MEM output_MEM) {
        _output_MEM = output_MEM;
    }

    struct ContextObject {

        typeof_NEW _input_NEW;

        bool _isInputDirty_UPD;

        bool _isOutputDirty_MEM : 1;
    };

    using Context = ContextObject*;

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_NEW input_UPD" \
                " output_MEM");
    }

    typeof_NEW getValue(Context ctx, identity<input_NEW>) {
        return ctx->_input_NEW;
    }
    typeof_UPD getValue(Context ctx, identity<input_UPD>) {
        return Pulse();
    }
    typeof_MEM getValue(Context ctx, identity<output_MEM>) {
        return this->_output_MEM;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                " input_UPD");
        return false;
    }

    bool isInputDirty(Context ctx, identity<input_UPD>) {
        return ctx->_isInputDirty_UPD;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_MEM");
    }

    void emitValue(Context ctx, typeof_MEM val, identity<output_MEM>) {
        this->_output_MEM = val;
        ctx->_isOutputDirty_MEM = true;
    }

    void evaluate(Context ctx) {
        if (!isInputDirty<input_UPD>(ctx))
            return;

        emitValue<output_MEM>(ctx, getValue<input_NEW>(ctx));
    }

};
} // namespace xod__core__buffer__number
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/cast-to-number(boolean) implementation
//-----------------------------------------------------------------------------
//#pragma XOD dirtieness disable

namespace xod {
namespace xod__core__cast_to_number__boolean {
struct Node {

    typedef Logic typeof_IN;

    typedef Number typeof_OUT;

    struct input_IN { };
    struct output_OUT { };

    static const identity<typeof_IN> getValueType(input_IN) {
      return identity<typeof_IN>();
    }
    static const identity<typeof_OUT> getValueType(output_OUT) {
      return identity<typeof_OUT>();
    }

    typeof_OUT _output_OUT;

    Node (typeof_OUT output_OUT) {
        _output_OUT = output_OUT;
    }

    struct ContextObject {

        typeof_IN _input_IN;

    };

    using Context = ContextObject*;

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN" \
                " output_OUT");
    }

    typeof_IN getValue(Context ctx, identity<input_IN>) {
        return ctx->_input_IN;
    }
    typeof_OUT getValue(Context ctx, identity<output_OUT>) {
        return this->_output_OUT;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, typeof_OUT val, identity<output_OUT>) {
        this->_output_OUT = val;
    }

    void evaluate(Context ctx) {
        emitValue<output_OUT>(ctx, getValue<input_IN>(ctx) ? 1.0 : 0.0);
    }

};
} // namespace xod__core__cast_to_number__boolean
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/branch implementation
//-----------------------------------------------------------------------------
//#pragma XOD evaluate_on_pin disable
//#pragma XOD evaluate_on_pin enable input_TRIG

namespace xod {
namespace xod__core__branch {
struct Node {

    typedef Logic typeof_GATE;
    typedef Pulse typeof_TRIG;

    typedef Pulse typeof_T;
    typedef Pulse typeof_F;

    struct input_GATE { };
    struct input_TRIG { };
    struct output_T { };
    struct output_F { };

    static const identity<typeof_GATE> getValueType(input_GATE) {
      return identity<typeof_GATE>();
    }
    static const identity<typeof_TRIG> getValueType(input_TRIG) {
      return identity<typeof_TRIG>();
    }
    static const identity<typeof_T> getValueType(output_T) {
      return identity<typeof_T>();
    }
    static const identity<typeof_F> getValueType(output_F) {
      return identity<typeof_F>();
    }

    Node () {
    }

    struct ContextObject {

        typeof_GATE _input_GATE;

        bool _isInputDirty_TRIG;

        bool _isOutputDirty_T : 1;
        bool _isOutputDirty_F : 1;
    };

    using Context = ContextObject*;

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_GATE input_TRIG" \
                " output_T output_F");
    }

    typeof_GATE getValue(Context ctx, identity<input_GATE>) {
        return ctx->_input_GATE;
    }
    typeof_TRIG getValue(Context ctx, identity<input_TRIG>) {
        return Pulse();
    }
    typeof_T getValue(Context ctx, identity<output_T>) {
        return Pulse();
    }
    typeof_F getValue(Context ctx, identity<output_F>) {
        return Pulse();
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                " input_TRIG");
        return false;
    }

    bool isInputDirty(Context ctx, identity<input_TRIG>) {
        return ctx->_isInputDirty_TRIG;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_T output_F");
    }

    void emitValue(Context ctx, typeof_T val, identity<output_T>) {
        ctx->_isOutputDirty_T = true;
    }
    void emitValue(Context ctx, typeof_F val, identity<output_F>) {
        ctx->_isOutputDirty_F = true;
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

};
} // namespace xod__core__branch
} // namespace xod

//-----------------------------------------------------------------------------
// @/play-note implementation
//-----------------------------------------------------------------------------

namespace xod {
namespace ____play_note {
template <uint8_t constant_input_PIN>
struct Node {

    typedef uint8_t typeof_PIN;
    typedef Number typeof_FREQ;
    typedef Number typeof_DUR;
    typedef Pulse typeof_UPD;

    struct State {
    };

    struct input_PIN { };
    struct input_FREQ { };
    struct input_DUR { };
    struct input_UPD { };

    static const identity<typeof_PIN> getValueType(input_PIN) {
      return identity<typeof_PIN>();
    }
    static const identity<typeof_FREQ> getValueType(input_FREQ) {
      return identity<typeof_FREQ>();
    }
    static const identity<typeof_DUR> getValueType(input_DUR) {
      return identity<typeof_DUR>();
    }
    static const identity<typeof_UPD> getValueType(input_UPD) {
      return identity<typeof_UPD>();
    }

    Node () {
    }

    struct ContextObject {

        typeof_FREQ _input_FREQ;
        typeof_DUR _input_DUR;

        bool _isInputDirty_UPD;

    };

    using Context = ContextObject*;

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_PIN input_FREQ input_DUR input_UPD" \
                "");
    }

    typeof_PIN getValue(Context ctx, identity<input_PIN>) {
        return constant_input_PIN;
    }
    typeof_FREQ getValue(Context ctx, identity<input_FREQ>) {
        return ctx->_input_FREQ;
    }
    typeof_DUR getValue(Context ctx, identity<input_DUR>) {
        return ctx->_input_DUR;
    }
    typeof_UPD getValue(Context ctx, identity<input_UPD>) {
        return Pulse();
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                " input_UPD");
        return false;
    }

    bool isInputDirty(Context ctx, identity<input_UPD>) {
        return ctx->_isInputDirty_UPD;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                "");
    }

    State state;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    void evaluate(Context ctx) {
        if (!isInputDirty<input_UPD>(ctx)) return;

        auto pin = getValue<input_PIN>(ctx);
        auto frequency = getValue<input_FREQ>(ctx);
        auto duration = getValue<input_DUR>(ctx);

        tone(pin, frequency);
        delay(duration*1000);
        noTone(pin);
    }

};
} // namespace ____play_note
} // namespace xod

//-----------------------------------------------------------------------------
// xod-dev/text-lcd/print-at(text-lcd-i2c-device) implementation
//-----------------------------------------------------------------------------

namespace xod {
namespace xod_dev__text_lcd__print_at__text_lcd_i2c_device {
struct Node {

    typedef xod_dev__text_lcd__text_lcd_i2c_device::Node::Type typeof_DEV;
    typedef Number typeof_ROW;
    typedef Number typeof_POS;
    typedef Number typeof_LEN;
    typedef XString typeof_VAL;
    typedef Pulse typeof_DO;

    typedef xod_dev__text_lcd__text_lcd_i2c_device::Node::Type typeof_DEVU0027;
    typedef Pulse typeof_DONE;

    struct input_DEV { };
    struct input_ROW { };
    struct input_POS { };
    struct input_LEN { };
    struct input_VAL { };
    struct input_DO { };
    struct output_DEVU0027 { };
    struct output_DONE { };

    static const identity<typeof_DEV> getValueType(input_DEV) {
      return identity<typeof_DEV>();
    }
    static const identity<typeof_ROW> getValueType(input_ROW) {
      return identity<typeof_ROW>();
    }
    static const identity<typeof_POS> getValueType(input_POS) {
      return identity<typeof_POS>();
    }
    static const identity<typeof_LEN> getValueType(input_LEN) {
      return identity<typeof_LEN>();
    }
    static const identity<typeof_VAL> getValueType(input_VAL) {
      return identity<typeof_VAL>();
    }
    static const identity<typeof_DO> getValueType(input_DO) {
      return identity<typeof_DO>();
    }
    static const identity<typeof_DEVU0027> getValueType(output_DEVU0027) {
      return identity<typeof_DEVU0027>();
    }
    static const identity<typeof_DONE> getValueType(output_DONE) {
      return identity<typeof_DONE>();
    }

    union NodeErrors {
        struct {
            bool output_DEVU0027 : 1;
            bool output_DONE : 1;
        };

        ErrorFlags flags = 0;
    };

    NodeErrors errors = {};

    typeof_DEVU0027 _output_DEVU0027;

    Node (typeof_DEVU0027 output_DEVU0027) {
        _output_DEVU0027 = output_DEVU0027;
    }

    struct ContextObject {

        typeof_DEV _input_DEV;
        typeof_ROW _input_ROW;
        typeof_POS _input_POS;
        typeof_LEN _input_LEN;
        typeof_VAL _input_VAL;

        bool _isInputDirty_DO;

        bool _isOutputDirty_DEVU0027 : 1;
        bool _isOutputDirty_DONE : 1;
    };

    using Context = ContextObject*;

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_DEV input_ROW input_POS input_LEN input_VAL input_DO" \
                " output_DEVU0027 output_DONE");
    }

    typeof_DEV getValue(Context ctx, identity<input_DEV>) {
        return ctx->_input_DEV;
    }
    typeof_ROW getValue(Context ctx, identity<input_ROW>) {
        return ctx->_input_ROW;
    }
    typeof_POS getValue(Context ctx, identity<input_POS>) {
        return ctx->_input_POS;
    }
    typeof_LEN getValue(Context ctx, identity<input_LEN>) {
        return ctx->_input_LEN;
    }
    typeof_VAL getValue(Context ctx, identity<input_VAL>) {
        return ctx->_input_VAL;
    }
    typeof_DO getValue(Context ctx, identity<input_DO>) {
        return Pulse();
    }
    typeof_DEVU0027 getValue(Context ctx, identity<output_DEVU0027>) {
        return this->_output_DEVU0027;
    }
    typeof_DONE getValue(Context ctx, identity<output_DONE>) {
        return Pulse();
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                " input_DO");
        return false;
    }

    bool isInputDirty(Context ctx, identity<input_DO>) {
        return ctx->_isInputDirty_DO;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_DEVU0027 output_DONE");
    }

    void emitValue(Context ctx, typeof_DEVU0027 val, identity<output_DEVU0027>) {
        this->_output_DEVU0027 = val;
        ctx->_isOutputDirty_DEVU0027 = true;
        this->errors.output_DEVU0027 = false;
    }
    void emitValue(Context ctx, typeof_DONE val, identity<output_DONE>) {
        ctx->_isOutputDirty_DONE = true;
        this->errors.output_DONE = false;
    }

    template<typename OutputT> void raiseError(Context ctx) {
        raiseError(ctx, identity<OutputT>());
    }

    template<typename OutputT> void raiseError(Context ctx, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_DEVU0027 output_DONE");
    }

    void raiseError(Context ctx, identity<output_DEVU0027>) {
        this->errors.output_DEVU0027 = true;
        ctx->_isOutputDirty_DEVU0027 = true;
    }
    void raiseError(Context ctx, identity<output_DONE>) {
        this->errors.output_DONE = true;
        ctx->_isOutputDirty_DONE = true;
    }

    void raiseError(Context ctx) {
        this->errors.output_DEVU0027 = true;
        ctx->_isOutputDirty_DEVU0027 = true;
        this->errors.output_DONE = true;
        ctx->_isOutputDirty_DONE = true;
    }

    static void printAt(LiquidCrystal_I2C* lcd, uint8_t rowIndex, uint8_t posIndex, uint8_t len, XString str) {
        lcd->setCursor(posIndex, rowIndex);
        uint8_t whitespace = len;
        for (auto it = str.iterate(); it && whitespace > 0; ++it, --whitespace)
            lcd->write(*it);

        // Clear the rest of the area
        while (whitespace--)
            lcd->write(' ');
    }

    void evaluate(Context ctx) {
        auto t = getValue<input_DEV>(ctx);

        if (isInputDirty<input_DO>(ctx)) {
            XString str = getValue<input_VAL>(ctx);
            uint8_t row = (uint8_t) getValue<input_ROW>(ctx);
            uint8_t pos = (uint8_t) getValue<input_POS>(ctx);

            Number _len = getValue<input_LEN>(ctx);
            uint8_t restLen = t.cols - pos;
            uint8_t len = (_len > restLen) ? restLen : (uint8_t) _len;

            if (row < 0 || row >= t.rows || pos < 0 || pos >= t.cols) {
                raiseError<output_DONE>(ctx);
                return;
            }

            printAt(t.lcd, row, pos, len, str);
            emitValue<output_DONE>(ctx, 1);
        }

        emitValue<output_DEVU0027>(ctx, t);
    }

};
} // namespace xod_dev__text_lcd__print_at__text_lcd_i2c_device
} // namespace xod
;

//-----------------------------------------------------------------------------
// xod-dev/servo/rotate implementation
//-----------------------------------------------------------------------------
//#pragma XOD evaluate_on_pin disable
//#pragma XOD evaluate_on_pin enable input_DO

namespace xod {
namespace xod_dev__servo__rotate {
template <typename typeof_DEV>
struct Node {

    typedef Number typeof_VAL;
    typedef Pulse typeof_DO;

    typedef typeof_DEV typeof_DEVU0027;
    typedef Pulse typeof_ACK;

    struct input_DEV { };
    struct input_VAL { };
    struct input_DO { };
    struct output_DEVU0027 { };
    struct output_ACK { };

    static const identity<typeof_DEV> getValueType(input_DEV) {
      return identity<typeof_DEV>();
    }
    static const identity<typeof_VAL> getValueType(input_VAL) {
      return identity<typeof_VAL>();
    }
    static const identity<typeof_DO> getValueType(input_DO) {
      return identity<typeof_DO>();
    }
    static const identity<typeof_DEVU0027> getValueType(output_DEVU0027) {
      return identity<typeof_DEVU0027>();
    }
    static const identity<typeof_ACK> getValueType(output_ACK) {
      return identity<typeof_ACK>();
    }

    typeof_DEVU0027 _output_DEVU0027;

    Node (typeof_DEVU0027 output_DEVU0027) {
        _output_DEVU0027 = output_DEVU0027;
    }

    struct ContextObject {

        typeof_DEV _input_DEV;
        typeof_VAL _input_VAL;

        bool _isInputDirty_DO;

        bool _isOutputDirty_DEVU0027 : 1;
        bool _isOutputDirty_ACK : 1;
    };

    using Context = ContextObject*;

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_DEV input_VAL input_DO" \
                " output_DEVU0027 output_ACK");
    }

    typeof_DEV getValue(Context ctx, identity<input_DEV>) {
        return ctx->_input_DEV;
    }
    typeof_VAL getValue(Context ctx, identity<input_VAL>) {
        return ctx->_input_VAL;
    }
    typeof_DO getValue(Context ctx, identity<input_DO>) {
        return Pulse();
    }
    typeof_DEVU0027 getValue(Context ctx, identity<output_DEVU0027>) {
        return this->_output_DEVU0027;
    }
    typeof_ACK getValue(Context ctx, identity<output_ACK>) {
        return Pulse();
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                " input_DO");
        return false;
    }

    bool isInputDirty(Context ctx, identity<input_DO>) {
        return ctx->_isInputDirty_DO;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_DEVU0027 output_ACK");
    }

    void emitValue(Context ctx, typeof_DEVU0027 val, identity<output_DEVU0027>) {
        this->_output_DEVU0027 = val;
        ctx->_isOutputDirty_DEVU0027 = true;
    }
    void emitValue(Context ctx, typeof_ACK val, identity<output_ACK>) {
        ctx->_isOutputDirty_ACK = true;
    }

    void evaluate(Context ctx) {
        auto xservo = getValue<input_DEV>(ctx);

        if (isSettingUp()) {
            // Short-circuit DEV and DEV'
            emitValue<output_DEVU0027>(ctx, xservo);
        }

        if (!isInputDirty<input_DO>(ctx))
            return;

        auto angle = getValue<input_VAL>(ctx);
        xservo->write01(angle);
        emitValue<output_ACK>(ctx, 1);
    }

};
} // namespace xod_dev__servo__rotate
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/defer(number) implementation
//-----------------------------------------------------------------------------
//#pragma XOD error_catch enable
//#pragma XOD error_raise enable

namespace xod {
namespace xod__core__defer__number {
struct Node {

    typedef Number typeof_IN;

    typedef Number typeof_OUT;

    struct input_IN { };
    struct output_OUT { };

    static const identity<typeof_IN> getValueType(input_IN) {
      return identity<typeof_IN>();
    }
    static const identity<typeof_OUT> getValueType(output_OUT) {
      return identity<typeof_OUT>();
    }

    union NodeErrors {
        struct {
            bool output_OUT : 1;
        };

        ErrorFlags flags = 0;
    };

    NodeErrors errors = {};
    bool isSetImmediate = false;

    typeof_OUT _output_OUT;

    Node (typeof_OUT output_OUT) {
        _output_OUT = output_OUT;
    }

    struct ContextObject {
        uint8_t _error_input_IN;

        typeof_IN _input_IN;

        bool _isOutputDirty_OUT : 1;
    };

    using Context = ContextObject*;

    void setImmediate() {
      this->isSetImmediate = true;
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN" \
                " output_OUT");
    }

    typeof_IN getValue(Context ctx, identity<input_IN>) {
        return ctx->_input_IN;
    }
    typeof_OUT getValue(Context ctx, identity<output_OUT>) {
        return this->_output_OUT;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, typeof_OUT val, identity<output_OUT>) {
        this->_output_OUT = val;
        ctx->_isOutputDirty_OUT = true;
        if (isEarlyDeferPass()) this->errors.output_OUT = false;
    }

    template<typename OutputT> void raiseError(Context ctx) {
        raiseError(ctx, identity<OutputT>());
    }

    template<typename OutputT> void raiseError(Context ctx, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void raiseError(Context ctx, identity<output_OUT>) {
        this->errors.output_OUT = true;
        ctx->_isOutputDirty_OUT = true;
    }

    void raiseError(Context ctx) {
        this->errors.output_OUT = true;
        ctx->_isOutputDirty_OUT = true;
    }

    template<typename InputT> uint8_t getError(Context ctx) {
        return getError(ctx, identity<InputT>());
    }

    template<typename InputT> uint8_t getError(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                " input_IN");
        return 0;
    }

    uint8_t getError(Context ctx, identity<input_IN>) {
        return ctx->_error_input_IN;
    }

    bool shouldRaiseAtTheNextDeferOnlyRun = false;

    void evaluate(Context ctx) {
        if (isEarlyDeferPass()) {
            if (shouldRaiseAtTheNextDeferOnlyRun) {
                raiseError<output_OUT>(ctx);
                shouldRaiseAtTheNextDeferOnlyRun = false;
            } else {
                emitValue<output_OUT>(ctx, getValue<output_OUT>(ctx));
            }
        } else {
            if (getError<input_IN>(ctx)) {
                shouldRaiseAtTheNextDeferOnlyRun = true;
            } else {
                // save the value for reemission on deferred-only evaluation pass
                emitValue<output_OUT>(ctx, getValue<input_IN>(ctx));
            }

            setImmediate();
        }
    }

};
} // namespace xod__core__defer__number
} // namespace xod
;

//-----------------------------------------------------------------------------
// xod/core/defer(pulse) implementation
//-----------------------------------------------------------------------------
//#pragma XOD error_catch enable
//#pragma XOD error_raise enable

namespace xod {
namespace xod__core__defer__pulse {
struct Node {

    typedef Pulse typeof_IN;

    typedef Pulse typeof_OUT;

    struct input_IN { };
    struct output_OUT { };

    static const identity<typeof_IN> getValueType(input_IN) {
      return identity<typeof_IN>();
    }
    static const identity<typeof_OUT> getValueType(output_OUT) {
      return identity<typeof_OUT>();
    }

    union NodeErrors {
        struct {
            bool output_OUT : 1;
        };

        ErrorFlags flags = 0;
    };

    NodeErrors errors = {};
    bool isSetImmediate = false;

    Node () {
    }

    struct ContextObject {
        uint8_t _error_input_IN;

        bool _isInputDirty_IN;

        bool _isOutputDirty_OUT : 1;
    };

    using Context = ContextObject*;

    void setImmediate() {
      this->isSetImmediate = true;
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN" \
                " output_OUT");
    }

    typeof_IN getValue(Context ctx, identity<input_IN>) {
        return Pulse();
    }
    typeof_OUT getValue(Context ctx, identity<output_OUT>) {
        return Pulse();
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                " input_IN");
        return false;
    }

    bool isInputDirty(Context ctx, identity<input_IN>) {
        return ctx->_isInputDirty_IN;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, typeof_OUT val, identity<output_OUT>) {
        ctx->_isOutputDirty_OUT = true;
        if (isEarlyDeferPass()) this->errors.output_OUT = false;
    }

    template<typename OutputT> void raiseError(Context ctx) {
        raiseError(ctx, identity<OutputT>());
    }

    template<typename OutputT> void raiseError(Context ctx, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void raiseError(Context ctx, identity<output_OUT>) {
        this->errors.output_OUT = true;
        ctx->_isOutputDirty_OUT = true;
    }

    void raiseError(Context ctx) {
        this->errors.output_OUT = true;
        ctx->_isOutputDirty_OUT = true;
    }

    template<typename InputT> uint8_t getError(Context ctx) {
        return getError(ctx, identity<InputT>());
    }

    template<typename InputT> uint8_t getError(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                " input_IN");
        return 0;
    }

    uint8_t getError(Context ctx, identity<input_IN>) {
        return ctx->_error_input_IN;
    }

    bool shouldRaiseAtTheNextDeferOnlyRun = false;
    bool shouldPulseAtTheNextDeferOnlyRun = false;

    void evaluate(Context ctx) {
        if (isEarlyDeferPass()) {
            if (shouldRaiseAtTheNextDeferOnlyRun) {
                raiseError<output_OUT>(ctx);
                shouldRaiseAtTheNextDeferOnlyRun = false;
            }

            if (shouldPulseAtTheNextDeferOnlyRun) {
                emitValue<output_OUT>(ctx, true);
                shouldPulseAtTheNextDeferOnlyRun = false;
            }
        } else {
            if (getError<input_IN>(ctx)) {
                shouldRaiseAtTheNextDeferOnlyRun = true;
            } else if (isInputDirty<input_IN>(ctx)) {
                shouldPulseAtTheNextDeferOnlyRun = true;
            }

            setImmediate();
        }
    }

};
} // namespace xod__core__defer__pulse
} // namespace xod
;


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

// outputs of constant nodes
constexpr Number node_0_output_VAL = 0;
constexpr Number node_1_output_VAL = 0;
constexpr Number node_2_output_VAL = 1;
constexpr Number node_3_output_VAL = 1;
constexpr Number node_4_output_VAL = 0;
constexpr uint8_t node_5_output_VAL = A3;
constexpr Number node_6_output_VAL = 0.02;
constexpr uint8_t node_7_output_VAL = 12;
constexpr Number node_8_output_VAL = 0.3;
constexpr Number node_9_output_VAL = 0.15;
constexpr Number node_10_output_VAL = 0.35;
constexpr Number node_11_output_VAL = 25;
constexpr Number node_12_output_VAL = 125;
constexpr uint8_t node_13_output_VAL = A1;
constexpr Number node_14_output_VAL = 15;
constexpr Number node_15_output_VAL = 0.5;
constexpr Number node_16_output_VAL = 0.5;
constexpr Number node_17_output_VAL = 0.5;
constexpr Number node_18_output_VAL = 0.5;
constexpr uint8_t node_19_output_VAL = 9;
constexpr Number node_20_output_VAL = 660;
constexpr Number node_21_output_VAL = 0.5;
constexpr uint8_t node_22_output_VAL = 9;
constexpr Number node_23_output_VAL = 440;
constexpr uint8_t node_24_output_VAL = 8;
constexpr Logic node_25_output_VAL = true;
constexpr uint8_t node_26_output_VAL = 10;
constexpr Logic node_27_output_VAL = true;
constexpr Number node_28_output_VAL = 0.3;
constexpr Number node_29_output_VAL = 0.02;
constexpr uint8_t node_30_output_VAL = 13;
constexpr uint8_t node_31_output_VAL = A0;
constexpr Number node_32_output_VAL = 0.5;
static XStringCString node_33_output_VAL = XStringCString("Storm upon us");
constexpr Logic node_34_output_VAL = true;
constexpr Logic node_35_output_VAL = true;
constexpr Logic node_36_output_VAL = true;
static XStringCString node_37_output_VAL = XStringCString("ERR");
constexpr Number node_38_output_VAL = 0;
constexpr Number node_39_output_VAL = 0;
constexpr Number node_40_output_VAL = INFINITY;
constexpr uint8_t node_41_output_VAL = 0x38;
constexpr Number node_42_output_VAL = 16;
constexpr Number node_43_output_VAL = 2;
constexpr Logic node_44_output_VAL = true;
constexpr Number node_45_output_VAL = 1;
constexpr Number node_46_output_VAL = 0;
constexpr Number node_47_output_VAL = INFINITY;
constexpr Logic node_48_output_VAL = true;
static XStringCString node_49_output_VAL = XStringCString("ERR");
constexpr Number node_50_output_VAL = 30;
static XStringCString node_51_output_VAL = XStringCString("Overheating");
static XStringCString node_52_output_VAL = XStringCString("Oh, hi Mars");
static XStringCString node_53_output_VAL = XStringCString("С=");
static XStringCString node_54_output_VAL = XStringCString(" T=");
static XStringCString node_55_output_VAL = XStringCString("Code red! Panic!");
constexpr Number node_56_output_VAL = 1.5;
constexpr Number node_57_output_VAL = 0;
constexpr Number node_58_output_VAL = 0.2;
constexpr Number node_59_output_VAL = 180;
constexpr Number node_60_output_VAL = 180;
constexpr Number node_61_output_VAL = 18;
constexpr Number node_62_output_VAL = 0;
constexpr Number node_63_output_VAL = 180;
constexpr Number node_64_output_VAL = 0;
constexpr Number node_65_output_VAL = 1;
constexpr uint8_t node_66_output_VAL = 11;
constexpr Logic node_67_output_VAL = true;
constexpr uint8_t node_68_output_VAL = 6;
constexpr Number node_69_output_VAL = 544;
constexpr Number node_70_output_VAL = 2400;
constexpr Logic node_71_output_VAL = true;
constexpr Logic node_72_output_VAL = true;
constexpr Logic node_73_output_VAL = true;
constexpr Logic node_74_output_VAL = true;
constexpr Logic node_75_output_VAL = true;
constexpr Logic node_76_output_VAL = true;
constexpr Logic node_77_output_VAL = true;
constexpr Logic node_78_output_VAL = true;

#pragma GCC diagnostic pop

struct TransactionState {
    bool node_79_isNodeDirty : 1;
    bool node_79_isOutputDirty_TICK : 1;
    bool node_80_isNodeDirty : 1;
    bool node_80_isOutputDirty_BOOT : 1;
    bool node_81_isNodeDirty : 1;
    bool node_81_isOutputDirty_OUT : 1;
    bool node_82_isNodeDirty : 1;
    bool node_82_isOutputDirty_OUT : 1;
    bool node_83_isNodeDirty : 1;
    bool node_83_isOutputDirty_DEV : 1;
    bool node_84_isNodeDirty : 1;
    bool node_84_isOutputDirty_OUT : 1;
    bool node_85_isNodeDirty : 1;
    bool node_86_isNodeDirty : 1;
    bool node_86_isOutputDirty_OUT : 1;
    bool node_87_isNodeDirty : 1;
    bool node_87_isOutputDirty_OUT : 1;
    bool node_88_isNodeDirty : 1;
    bool node_88_isOutputDirty_OUT : 1;
    bool node_89_isNodeDirty : 1;
    bool node_89_isOutputDirty_OUT : 1;
    bool node_90_isNodeDirty : 1;
    bool node_90_isOutputDirty_OUT : 1;
    bool node_91_isNodeDirty : 1;
    bool node_91_isOutputDirty_OUT : 1;
    bool node_92_isNodeDirty : 1;
    bool node_92_isOutputDirty_OUT : 1;
    bool node_93_isNodeDirty : 1;
    bool node_93_isOutputDirty_VAL : 1;
    bool node_94_isNodeDirty : 1;
    bool node_94_isOutputDirty_SIG : 1;
    bool node_95_isNodeDirty : 1;
    bool node_95_isOutputDirty_VAL : 1;
    bool node_96_isNodeDirty : 1;
    bool node_96_isOutputDirty_SIG : 1;
    bool node_97_isNodeDirty : 1;
    bool node_97_isOutputDirty_VAL : 1;
    bool node_98_isNodeDirty : 1;
    bool node_98_isOutputDirty_OUT : 1;
    bool node_99_isNodeDirty : 1;
    bool node_99_isOutputDirty_OUT : 1;
    bool node_100_isNodeDirty : 1;
    bool node_100_isOutputDirty_OUT : 1;
    bool node_101_isNodeDirty : 1;
    bool node_101_isOutputDirty_OUT : 1;
    bool node_102_isNodeDirty : 1;
    bool node_102_isOutputDirty_OUT : 1;
    bool node_103_isNodeDirty : 1;
    bool node_103_isOutputDirty_OUT : 1;
    bool node_104_isNodeDirty : 1;
    bool node_104_isOutputDirty_OUT : 1;
    bool node_105_isNodeDirty : 1;
    bool node_105_isOutputDirty_OUT : 1;
    bool node_106_isNodeDirty : 1;
    bool node_106_isOutputDirty_OUT : 1;
    bool node_107_isNodeDirty : 1;
    bool node_107_isOutputDirty_OUT : 1;
    bool node_107_hasUpstreamError : 1;
    bool node_108_isNodeDirty : 1;
    bool node_108_isOutputDirty_OUT : 1;
    bool node_109_isNodeDirty : 1;
    bool node_109_isOutputDirty_OUT : 1;
    bool node_110_isNodeDirty : 1;
    bool node_110_isOutputDirty_OUT : 1;
    bool node_111_isNodeDirty : 1;
    bool node_111_isOutputDirty_OUT : 1;
    bool node_112_isNodeDirty : 1;
    bool node_112_isOutputDirty_OUT : 1;
    bool node_113_isNodeDirty : 1;
    bool node_113_isOutputDirty_OUT : 1;
    bool node_114_isNodeDirty : 1;
    bool node_114_isOutputDirty_OUT : 1;
    bool node_115_isNodeDirty : 1;
    bool node_115_isOutputDirty_R : 1;
    bool node_116_isNodeDirty : 1;
    bool node_116_isOutputDirty_R : 1;
    bool node_116_hasUpstreamError : 1;
    bool node_117_isNodeDirty : 1;
    bool node_117_isOutputDirty_OUT : 1;
    bool node_118_isNodeDirty : 1;
    bool node_118_isOutputDirty_OUT : 1;
    bool node_119_isNodeDirty : 1;
    bool node_119_isOutputDirty_OUT : 1;
    bool node_120_isNodeDirty : 1;
    bool node_120_isOutputDirty_OUT : 1;
    bool node_121_isNodeDirty : 1;
    bool node_121_isOutputDirty_R : 1;
    bool node_122_isNodeDirty : 1;
    bool node_122_isOutputDirty_OUT : 1;
    bool node_123_isNodeDirty : 1;
    bool node_123_isOutputDirty_DEVU0027 : 1;
    bool node_123_isOutputDirty_DONE : 1;
    bool node_123_hasUpstreamError : 1;
    bool node_124_isNodeDirty : 1;
    bool node_125_isNodeDirty : 1;
    bool node_125_isOutputDirty_OUT : 1;
    bool node_126_isNodeDirty : 1;
    bool node_126_isOutputDirty_OUT : 1;
    bool node_127_isNodeDirty : 1;
    bool node_127_isOutputDirty_OUT : 1;
    bool node_128_isNodeDirty : 1;
    bool node_128_isOutputDirty_OUT : 1;
    bool node_129_isNodeDirty : 1;
    bool node_129_isOutputDirty_MEM : 1;
    bool node_130_isNodeDirty : 1;
    bool node_130_isOutputDirty_OUT : 1;
    bool node_131_isNodeDirty : 1;
    bool node_131_isOutputDirty_OUT : 1;
    bool node_132_isNodeDirty : 1;
    bool node_132_isOutputDirty_OUT : 1;
    bool node_132_hasUpstreamError : 1;
    bool node_133_isNodeDirty : 1;
    bool node_133_isOutputDirty_OUT : 1;
    bool node_134_isNodeDirty : 1;
    bool node_134_isOutputDirty_OUT : 1;
    bool node_135_isNodeDirty : 1;
    bool node_135_isOutputDirty_MEM : 1;
    bool node_135_hasUpstreamError : 1;
    bool node_136_isNodeDirty : 1;
    bool node_136_isOutputDirty_OUT : 1;
    bool node_137_isNodeDirty : 1;
    bool node_137_isOutputDirty_TICK : 1;
    bool node_138_isNodeDirty : 1;
    bool node_138_isOutputDirty_R : 1;
    bool node_139_isNodeDirty : 1;
    bool node_139_isOutputDirty_TICK : 1;
    bool node_140_isNodeDirty : 1;
    bool node_140_isOutputDirty_OUT : 1;
    bool node_141_isNodeDirty : 1;
    bool node_141_hasUpstreamError : 1;
    bool node_142_isNodeDirty : 1;
    bool node_142_isOutputDirty_TICK : 1;
    bool node_142_hasUpstreamError : 1;
    bool node_143_isNodeDirty : 1;
    bool node_143_isOutputDirty_OUT : 1;
    bool node_144_isNodeDirty : 1;
    bool node_144_isOutputDirty_MEM : 1;
    bool node_145_isNodeDirty : 1;
    bool node_145_isOutputDirty_OUT : 1;
    bool node_146_isNodeDirty : 1;
    bool node_146_isOutputDirty_MEM : 1;
    bool node_147_isNodeDirty : 1;
    bool node_148_isNodeDirty : 1;
    bool node_148_isOutputDirty_OUT : 1;
    bool node_148_hasUpstreamError : 1;
    bool node_149_isNodeDirty : 1;
    bool node_149_isOutputDirty_OUT : 1;
    bool node_149_hasUpstreamError : 1;
    bool node_150_isNodeDirty : 1;
    bool node_150_isOutputDirty_OUT : 1;
    bool node_151_isNodeDirty : 1;
    bool node_151_isOutputDirty_OUT : 1;
    bool node_152_isNodeDirty : 1;
    bool node_152_isOutputDirty_OUT : 1;
    bool node_153_isNodeDirty : 1;
    bool node_153_isOutputDirty_OUT : 1;
    bool node_153_hasUpstreamError : 1;
    bool node_154_isNodeDirty : 1;
    bool node_154_isOutputDirty_R : 1;
    bool node_155_isNodeDirty : 1;
    bool node_155_hasUpstreamError : 1;
    bool node_156_isNodeDirty : 1;
    bool node_156_hasUpstreamError : 1;
    bool node_157_isNodeDirty : 1;
    bool node_157_isOutputDirty_MEM : 1;
    bool node_157_hasUpstreamError : 1;
    bool node_158_isNodeDirty : 1;
    bool node_158_isOutputDirty_OUT : 1;
    bool node_159_isNodeDirty : 1;
    bool node_159_isOutputDirty_OUT : 1;
    bool node_160_isNodeDirty : 1;
    bool node_160_isOutputDirty_OUT : 1;
    bool node_161_isNodeDirty : 1;
    bool node_161_isOutputDirty_OUT : 1;
    bool node_162_isNodeDirty : 1;
    bool node_162_isOutputDirty_OUT : 1;
    bool node_162_hasUpstreamError : 1;
    bool node_163_isNodeDirty : 1;
    bool node_163_isOutputDirty_R : 1;
    bool node_164_isNodeDirty : 1;
    bool node_164_isOutputDirty_T : 1;
    bool node_164_isOutputDirty_F : 1;
    bool node_164_hasUpstreamError : 1;
    bool node_165_isNodeDirty : 1;
    bool node_165_isOutputDirty_OUT : 1;
    bool node_166_isNodeDirty : 1;
    bool node_167_isNodeDirty : 1;
    bool node_168_isNodeDirty : 1;
    bool node_168_isOutputDirty_OUT : 1;
    bool node_169_isNodeDirty : 1;
    bool node_169_isOutputDirty_OUT : 1;
    bool node_170_isNodeDirty : 1;
    bool node_170_isOutputDirty_OUT : 1;
    bool node_170_hasUpstreamError : 1;
    bool node_171_isNodeDirty : 1;
    bool node_171_isOutputDirty_OUT : 1;
    bool node_172_isNodeDirty : 1;
    bool node_172_isOutputDirty_OUT : 1;
    bool node_172_hasUpstreamError : 1;
    bool node_173_isNodeDirty : 1;
    bool node_173_isOutputDirty_MEM : 1;
    bool node_173_hasUpstreamError : 1;
    bool node_174_isNodeDirty : 1;
    bool node_175_isNodeDirty : 1;
    bool node_175_isOutputDirty_OUT : 1;
    bool node_176_isNodeDirty : 1;
    bool node_177_isNodeDirty : 1;
    bool node_177_isOutputDirty_OUT : 1;
    bool node_178_isNodeDirty : 1;
    bool node_178_isOutputDirty_OUT : 1;
    bool node_178_hasUpstreamError : 1;
    bool node_179_isNodeDirty : 1;
    bool node_179_isOutputDirty_OUT : 1;
    bool node_179_hasUpstreamError : 1;
    bool node_180_isNodeDirty : 1;
    bool node_180_isOutputDirty_MEM : 1;
    bool node_180_hasUpstreamError : 1;
    bool node_181_isNodeDirty : 1;
    bool node_181_isOutputDirty_OUT : 1;
    bool node_182_isNodeDirty : 1;
    bool node_182_isOutputDirty_OUT : 1;
    bool node_183_isNodeDirty : 1;
    bool node_183_isOutputDirty_DEVU0027 : 1;
    bool node_183_isOutputDirty_DONE : 1;
    bool node_183_hasUpstreamError : 1;
    bool node_184_isNodeDirty : 1;
    bool node_184_isOutputDirty_OUT : 1;
    bool node_184_hasUpstreamError : 1;
    bool node_185_isNodeDirty : 1;
    bool node_185_isOutputDirty_R : 1;
    bool node_185_hasUpstreamError : 1;
    bool node_186_isNodeDirty : 1;
    bool node_186_isOutputDirty_OUT : 1;
    bool node_187_isNodeDirty : 1;
    bool node_187_isOutputDirty_OUT : 1;
    bool node_188_isNodeDirty : 1;
    bool node_188_isOutputDirty_OUT : 1;
    bool node_188_hasUpstreamError : 1;
    bool node_189_isNodeDirty : 1;
    bool node_189_isOutputDirty_OUT : 1;
    bool node_189_hasUpstreamError : 1;
    bool node_190_isNodeDirty : 1;
    bool node_190_isOutputDirty_OUT : 1;
    bool node_190_hasUpstreamError : 1;
    bool node_191_isNodeDirty : 1;
    bool node_192_isNodeDirty : 1;
    bool node_192_isOutputDirty_OUT : 1;
    bool node_193_isNodeDirty : 1;
    bool node_193_isOutputDirty_OUT : 1;
    bool node_193_hasUpstreamError : 1;
    bool node_194_isNodeDirty : 1;
    bool node_194_isOutputDirty_OUT : 1;
    bool node_194_hasUpstreamError : 1;
    bool node_195_isNodeDirty : 1;
    bool node_196_isNodeDirty : 1;
    bool node_196_isOutputDirty_DONE : 1;
    bool node_196_hasUpstreamError : 1;
    bool node_197_isNodeDirty : 1;
    bool node_197_isOutputDirty_OUT : 1;
    bool node_197_hasUpstreamError : 1;
    bool node_198_isNodeDirty : 1;
    bool node_198_hasUpstreamError : 1;
    bool node_199_isNodeDirty : 1;
    bool node_199_isOutputDirty_OUT : 1;
    bool node_199_hasUpstreamError : 1;
    bool node_200_isNodeDirty : 1;
    bool node_200_isOutputDirty_OUT : 1;
    bool node_200_hasUpstreamError : 1;
    bool node_201_isNodeDirty : 1;
    bool node_201_hasUpstreamError : 1;
    bool node_202_isNodeDirty : 1;
    bool node_202_isOutputDirty_OUT : 1;
    bool node_202_hasUpstreamError : 1;
    bool node_203_isNodeDirty : 1;
    bool node_203_isOutputDirty_OUT : 1;
    bool node_203_hasUpstreamError : 1;
    bool node_204_isNodeDirty : 1;
    bool node_204_isOutputDirty_OUT : 1;
    bool node_204_hasUpstreamError : 1;
    TransactionState() {
        node_79_isNodeDirty = true;
        node_79_isOutputDirty_TICK = false;
        node_80_isNodeDirty = true;
        node_80_isOutputDirty_BOOT = false;
        node_81_isNodeDirty = true;
        node_82_isNodeDirty = true;
        node_82_isOutputDirty_OUT = false;
        node_83_isNodeDirty = true;
        node_83_isOutputDirty_DEV = true;
        node_84_isNodeDirty = true;
        node_85_isNodeDirty = true;
        node_86_isNodeDirty = true;
        node_86_isOutputDirty_OUT = false;
        node_87_isNodeDirty = true;
        node_87_isOutputDirty_OUT = false;
        node_88_isNodeDirty = true;
        node_88_isOutputDirty_OUT = false;
        node_89_isNodeDirty = true;
        node_89_isOutputDirty_OUT = false;
        node_90_isNodeDirty = true;
        node_90_isOutputDirty_OUT = false;
        node_91_isNodeDirty = true;
        node_91_isOutputDirty_OUT = false;
        node_92_isNodeDirty = true;
        node_92_isOutputDirty_OUT = false;
        node_93_isNodeDirty = true;
        node_93_isOutputDirty_VAL = true;
        node_94_isNodeDirty = true;
        node_94_isOutputDirty_SIG = true;
        node_95_isNodeDirty = true;
        node_95_isOutputDirty_VAL = true;
        node_96_isNodeDirty = true;
        node_96_isOutputDirty_SIG = true;
        node_97_isNodeDirty = true;
        node_97_isOutputDirty_VAL = true;
        node_98_isNodeDirty = true;
        node_99_isNodeDirty = true;
        node_99_isOutputDirty_OUT = false;
        node_100_isNodeDirty = true;
        node_101_isNodeDirty = true;
        node_102_isNodeDirty = true;
        node_103_isNodeDirty = true;
        node_104_isNodeDirty = true;
        node_104_isOutputDirty_OUT = false;
        node_105_isNodeDirty = true;
        node_106_isNodeDirty = true;
        node_107_isNodeDirty = true;
        node_108_isNodeDirty = true;
        node_109_isNodeDirty = true;
        node_109_isOutputDirty_OUT = true;
        node_110_isNodeDirty = true;
        node_111_isNodeDirty = true;
        node_112_isNodeDirty = true;
        node_113_isNodeDirty = true;
        node_113_isOutputDirty_OUT = true;
        node_114_isNodeDirty = true;
        node_114_isOutputDirty_OUT = false;
        node_115_isNodeDirty = true;
        node_116_isNodeDirty = true;
        node_117_isNodeDirty = true;
        node_118_isNodeDirty = true;
        node_118_isOutputDirty_OUT = false;
        node_119_isNodeDirty = true;
        node_120_isNodeDirty = true;
        node_121_isNodeDirty = true;
        node_122_isNodeDirty = true;
        node_122_isOutputDirty_OUT = false;
        node_123_isNodeDirty = true;
        node_123_isOutputDirty_DEVU0027 = true;
        node_123_isOutputDirty_DONE = false;
        node_124_isNodeDirty = true;
        node_125_isNodeDirty = true;
        node_125_isOutputDirty_OUT = false;
        node_126_isNodeDirty = true;
        node_127_isNodeDirty = true;
        node_127_isOutputDirty_OUT = false;
        node_128_isNodeDirty = true;
        node_128_isOutputDirty_OUT = false;
        node_129_isNodeDirty = true;
        node_129_isOutputDirty_MEM = true;
        node_130_isNodeDirty = true;
        node_130_isOutputDirty_OUT = false;
        node_131_isNodeDirty = true;
        node_132_isNodeDirty = true;
        node_132_isOutputDirty_OUT = false;
        node_133_isNodeDirty = true;
        node_134_isNodeDirty = true;
        node_134_isOutputDirty_OUT = false;
        node_135_isNodeDirty = true;
        node_135_isOutputDirty_MEM = true;
        node_136_isNodeDirty = true;
        node_137_isNodeDirty = true;
        node_137_isOutputDirty_TICK = false;
        node_138_isNodeDirty = true;
        node_139_isNodeDirty = true;
        node_139_isOutputDirty_TICK = false;
        node_140_isNodeDirty = true;
        node_140_isOutputDirty_OUT = false;
        node_141_isNodeDirty = true;
        node_142_isNodeDirty = true;
        node_142_isOutputDirty_TICK = false;
        node_143_isNodeDirty = true;
        node_143_isOutputDirty_OUT = false;
        node_144_isNodeDirty = true;
        node_144_isOutputDirty_MEM = true;
        node_145_isNodeDirty = true;
        node_145_isOutputDirty_OUT = true;
        node_146_isNodeDirty = true;
        node_146_isOutputDirty_MEM = true;
        node_147_isNodeDirty = true;
        node_148_isNodeDirty = true;
        node_148_isOutputDirty_OUT = true;
        node_149_isNodeDirty = true;
        node_149_isOutputDirty_OUT = false;
        node_150_isNodeDirty = true;
        node_150_isOutputDirty_OUT = true;
        node_151_isNodeDirty = true;
        node_152_isNodeDirty = true;
        node_153_isNodeDirty = true;
        node_153_isOutputDirty_OUT = false;
        node_154_isNodeDirty = true;
        node_155_isNodeDirty = true;
        node_156_isNodeDirty = true;
        node_157_isNodeDirty = true;
        node_157_isOutputDirty_MEM = true;
        node_158_isNodeDirty = true;
        node_159_isNodeDirty = true;
        node_159_isOutputDirty_OUT = false;
        node_160_isNodeDirty = true;
        node_161_isNodeDirty = true;
        node_162_isNodeDirty = true;
        node_162_isOutputDirty_OUT = false;
        node_163_isNodeDirty = true;
        node_164_isNodeDirty = true;
        node_164_isOutputDirty_T = false;
        node_164_isOutputDirty_F = false;
        node_165_isNodeDirty = true;
        node_165_isOutputDirty_OUT = false;
        node_166_isNodeDirty = true;
        node_167_isNodeDirty = true;
        node_168_isNodeDirty = true;
        node_168_isOutputDirty_OUT = false;
        node_169_isNodeDirty = true;
        node_170_isNodeDirty = true;
        node_170_isOutputDirty_OUT = false;
        node_171_isNodeDirty = true;
        node_171_isOutputDirty_OUT = true;
        node_172_isNodeDirty = true;
        node_172_isOutputDirty_OUT = false;
        node_173_isNodeDirty = true;
        node_173_isOutputDirty_MEM = true;
        node_174_isNodeDirty = true;
        node_175_isNodeDirty = true;
        node_175_isOutputDirty_OUT = false;
        node_176_isNodeDirty = true;
        node_177_isNodeDirty = true;
        node_177_isOutputDirty_OUT = false;
        node_178_isNodeDirty = true;
        node_178_isOutputDirty_OUT = false;
        node_179_isNodeDirty = true;
        node_179_isOutputDirty_OUT = false;
        node_180_isNodeDirty = true;
        node_180_isOutputDirty_MEM = true;
        node_181_isNodeDirty = true;
        node_181_isOutputDirty_OUT = false;
        node_182_isNodeDirty = true;
        node_182_isOutputDirty_OUT = false;
        node_183_isNodeDirty = true;
        node_183_isOutputDirty_DEVU0027 = true;
        node_183_isOutputDirty_DONE = false;
        node_184_isNodeDirty = true;
        node_184_isOutputDirty_OUT = false;
        node_185_isNodeDirty = true;
        node_186_isNodeDirty = true;
        node_186_isOutputDirty_OUT = false;
        node_187_isNodeDirty = true;
        node_187_isOutputDirty_OUT = false;
        node_188_isNodeDirty = true;
        node_188_isOutputDirty_OUT = false;
        node_189_isNodeDirty = true;
        node_189_isOutputDirty_OUT = false;
        node_190_isNodeDirty = true;
        node_191_isNodeDirty = true;
        node_192_isNodeDirty = true;
        node_192_isOutputDirty_OUT = false;
        node_193_isNodeDirty = true;
        node_193_isOutputDirty_OUT = false;
        node_194_isNodeDirty = true;
        node_194_isOutputDirty_OUT = false;
        node_195_isNodeDirty = true;
        node_196_isNodeDirty = true;
        node_196_isOutputDirty_DONE = false;
        node_197_isNodeDirty = true;
        node_197_isOutputDirty_OUT = false;
        node_198_isNodeDirty = true;
        node_199_isNodeDirty = true;
        node_199_isOutputDirty_OUT = false;
        node_200_isNodeDirty = true;
        node_200_isOutputDirty_OUT = false;
        node_201_isNodeDirty = true;
        node_202_isNodeDirty = true;
        node_202_isOutputDirty_OUT = true;
        node_203_isNodeDirty = true;
        node_203_isOutputDirty_OUT = false;
        node_204_isNodeDirty = true;
        node_204_isOutputDirty_OUT = true;
    }
};

TransactionState g_transaction;

typedef xod__core__continuously::Node Node_79;
Node_79 node_79 = Node_79();

typedef xod__core__boot::Node Node_80;
Node_80 node_80 = Node_80();

typedef xod__core__multiply::Node Node_81;
Node_81 node_81 = Node_81(0);

typedef xod__core__pulse_on_change__boolean::Node Node_82;
Node_82 node_82 = Node_82();

typedef xod_dev__text_lcd__text_lcd_i2c_device::Node Node_83;
Node_83 node_83 = Node_83({ /* xod-dev/text-lcd/text-lcd-i2c-device */ });

typedef xod__core__divide::Node Node_84;
Node_84 node_84 = Node_84(0);

typedef xod_dev__servo__servo_device::Node<node_68_output_VAL> Node_85;
Node_85 node_85 = Node_85({ /* xod-dev/servo/servo-device */ });

typedef xod__core__cast_to_pulse__boolean::Node Node_86;
Node_86 node_86 = Node_86();

typedef xod__core__cast_to_pulse__boolean::Node Node_87;
Node_87 node_87 = Node_87();

typedef xod__core__cast_to_pulse__boolean::Node Node_88;
Node_88 node_88 = Node_88();

typedef xod__core__cast_to_pulse__boolean::Node Node_89;
Node_89 node_89 = Node_89();

typedef xod__core__cast_to_pulse__boolean::Node Node_90;
Node_90 node_90 = Node_90();

typedef xod__core__cast_to_pulse__boolean::Node Node_91;
Node_91 node_91 = Node_91();

typedef xod__core__cast_to_pulse__boolean::Node Node_92;
Node_92 node_92 = Node_92();

typedef xod__gpio__analog_read::Node<node_5_output_VAL> Node_93;
Node_93 node_93 = Node_93(0);

typedef xod__gpio__digital_read_pullup::Node<node_7_output_VAL> Node_94;
Node_94 node_94 = Node_94(false);

typedef xod__gpio__analog_read::Node<node_13_output_VAL> Node_95;
Node_95 node_95 = Node_95(0);

typedef xod__gpio__digital_read_pullup::Node<node_30_output_VAL> Node_96;
Node_96 node_96 = Node_96(false);

typedef xod__gpio__analog_read::Node<node_31_output_VAL> Node_97;
Node_97 node_97 = Node_97(0);

typedef xod__core__subtract::Node Node_98;
Node_98 node_98 = Node_98(0);

typedef xod__core__any::Node Node_99;
Node_99 node_99 = Node_99();

typedef xod__math__map::Node Node_100;
Node_100 node_100 = Node_100(0);

typedef xod__core__not::Node Node_101;
Node_101 node_101 = Node_101(false);

typedef xod__math__map::Node Node_102;
Node_102 node_102 = Node_102(0);

typedef xod__core__not::Node Node_103;
Node_103 node_103 = Node_103(false);

typedef xod__core__any::Node Node_104;
Node_104 node_104 = Node_104();

typedef xod__core__less::Node Node_105;
Node_105 node_105 = Node_105(false);

typedef xod__core__less::Node Node_106;
Node_106 node_106 = Node_106(false);

typedef xod__core__less::Node Node_107;
Node_107 node_107 = Node_107(false);

typedef xod__core__cast_to_string__number::Node Node_108;
Node_108 node_108 = Node_108(XString());

typedef xod__core__debounce__boolean::Node Node_109;
Node_109 node_109 = Node_109(false);

typedef xod__core__less::Node Node_110;
Node_110 node_110 = Node_110(false);

typedef xod__core__greater::Node Node_111;
Node_111 node_111 = Node_111(false);

typedef xod__core__cast_to_string__number::Node Node_112;
Node_112 node_112 = Node_112(XString());

typedef xod__core__debounce__boolean::Node Node_113;
Node_113 node_113 = Node_113(false);

typedef xod__core__gate__pulse::Node Node_114;
Node_114 node_114 = Node_114();

typedef xod__core__if_else__number::Node Node_115;
Node_115 node_115 = Node_115(0);

typedef xod__core__if_else__number::Node Node_116;
Node_116 node_116 = Node_116(0);

typedef xod__core__concat::Node Node_117;
Node_117 node_117 = Node_117(XString());

typedef xod__core__pulse_on_true::Node Node_118;
Node_118 node_118 = Node_118();

typedef xod__core__not::Node Node_119;
Node_119 node_119 = Node_119(false);

typedef xod__core__and::Node Node_120;
Node_120 node_120 = Node_120(false);

typedef xod__core__if_else__string::Node Node_121;
Node_121 node_121 = Node_121(XString());

typedef xod__core__cast_to_pulse__boolean::Node Node_122;
Node_122 node_122 = Node_122();

typedef xod_dev__text_lcd__set_backlight::Node Node_123;
Node_123 node_123 = Node_123({ /* xod-dev/text-lcd/text-lcd-i2c-device */ });

typedef xod__math__cube::Node Node_124;
Node_124 node_124 = Node_124(0);

typedef xod__core__pulse_on_change__number::Node Node_125;
Node_125 node_125 = Node_125();

typedef xod__core__concat::Node Node_126;
Node_126 node_126 = Node_126(XString());

typedef xod__core__any::Node Node_127;
Node_127 node_127 = Node_127();

typedef xod__core__pulse_on_true::Node Node_128;
Node_128 node_128 = Node_128();

typedef xod__core__flip_flop::Node Node_129;
Node_129 node_129 = Node_129(false);

typedef xod__core__any::Node Node_130;
Node_130 node_130 = Node_130();

typedef xod__core__concat::Node Node_131;
Node_131 node_131 = Node_131(XString());

typedef xod__core__any::Node Node_132;
Node_132 node_132 = Node_132();

typedef xod__core__or::Node Node_133;
Node_133 node_133 = Node_133(false);

typedef xod__core__any::Node Node_134;
Node_134 node_134 = Node_134();

typedef xod__core__flip_flop::Node Node_135;
Node_135 node_135 = Node_135(false);

typedef xod__core__not::Node Node_136;
Node_136 node_136 = Node_136(false);

typedef xod__core__clock::Node Node_137;
Node_137 node_137 = Node_137();

typedef xod__core__if_else__string::Node Node_138;
Node_138 node_138 = Node_138(XString());

typedef xod__core__clock::Node Node_139;
Node_139 node_139 = Node_139();

typedef xod__core__gate__pulse::Node Node_140;
Node_140 node_140 = Node_140();

typedef xod__core__if_else__number::Node Node_141;
Node_141 node_141 = Node_141(0);

typedef xod__core__clock::Node Node_142;
Node_142 node_142 = Node_142();

typedef xod__core__pulse_on_true::Node Node_143;
Node_143 node_143 = Node_143();

typedef xod__core__flip_flop::Node Node_144;
Node_144 node_144 = Node_144(false);

typedef xod__core__if_error__string::Node Node_145;
Node_145 node_145 = Node_145(XString());

typedef xod__core__flip_flop::Node Node_146;
Node_146 node_146 = Node_146(false);

typedef xod__gpio__pwm_write::Node<node_66_output_VAL> Node_147;
Node_147 node_147 = Node_147();

typedef xod__core__count::Node Node_148;
Node_148 node_148 = Node_148(0);

typedef xod__core__any::Node Node_149;
Node_149 node_149 = Node_149();

typedef xod__core__square_wave::Node Node_150;
Node_150 node_150 = Node_150(false, 0);

typedef xod__core__and::Node Node_151;
Node_151 node_151 = Node_151(false);

typedef xod__core__not::Node Node_152;
Node_152 node_152 = Node_152(false);

typedef xod__core__pulse_on_change__string::Node Node_153;
Node_153 node_153 = Node_153();

typedef xod__core__if_else__string::Node Node_154;
Node_154 node_154 = Node_154(XString());

typedef xod__core__if_else__number::Node Node_155;
Node_155 node_155 = Node_155(0);

typedef xod__core__less::Node Node_156;
Node_156 node_156 = Node_156(false);

typedef xod__core__buffer__number::Node Node_157;
Node_157 node_157 = Node_157(0);

typedef xod__core__not::Node Node_158;
Node_158 node_158 = Node_158(false);

typedef xod__core__cast_to_pulse__boolean::Node Node_159;
Node_159 node_159 = Node_159();

typedef xod__core__cast_to_number__boolean::Node Node_160;
Node_160 node_160 = Node_160(0);

typedef xod__core__and::Node Node_161;
Node_161 node_161 = Node_161(false);

typedef xod__core__any::Node Node_162;
Node_162 node_162 = Node_162();

typedef xod__core__if_else__string::Node Node_163;
Node_163 node_163 = Node_163(XString());

typedef xod__core__branch::Node Node_164;
Node_164 node_164 = Node_164();

typedef xod__core__cast_to_pulse__boolean::Node Node_165;
Node_165 node_165 = Node_165();

typedef ____play_note::Node<node_22_output_VAL> Node_166;
Node_166 node_166 = Node_166();

typedef xod__math__cube::Node Node_167;
Node_167 node_167 = Node_167(0);

typedef xod__core__pulse_on_change__number::Node Node_168;
Node_168 node_168 = Node_168();

typedef xod__core__cast_to_number__boolean::Node Node_169;
Node_169 node_169 = Node_169(0);

typedef xod__core__any::Node Node_170;
Node_170 node_170 = Node_170();

typedef xod__core__if_error__string::Node Node_171;
Node_171 node_171 = Node_171(XString());

typedef xod__core__any::Node Node_172;
Node_172 node_172 = Node_172();

typedef xod__core__flip_flop::Node Node_173;
Node_173 node_173 = Node_173(false);

typedef ____play_note::Node<node_19_output_VAL> Node_174;
Node_174 node_174 = Node_174();

typedef xod__core__any::Node Node_175;
Node_175 node_175 = Node_175();

typedef xod__math__cube::Node Node_176;
Node_176 node_176 = Node_176(0);

typedef xod__core__pulse_on_change__number::Node Node_177;
Node_177 node_177 = Node_177();

typedef xod__core__gate__pulse::Node Node_178;
Node_178 node_178 = Node_178();

typedef xod__core__pulse_on_change__string::Node Node_179;
Node_179 node_179 = Node_179();

typedef xod__core__buffer__number::Node Node_180;
Node_180 node_180 = Node_180(0);

typedef xod__core__any::Node Node_181;
Node_181 node_181 = Node_181();

typedef xod__core__any::Node Node_182;
Node_182 node_182 = Node_182();

typedef xod_dev__text_lcd__print_at__text_lcd_i2c_device::Node Node_183;
Node_183 node_183 = Node_183({ /* xod-dev/text-lcd/text-lcd-i2c-device */ });

typedef xod__core__any::Node Node_184;
Node_184 node_184 = Node_184();

typedef xod__core__if_else__number::Node Node_185;
Node_185 node_185 = Node_185(0);

typedef xod__core__gate__pulse::Node Node_186;
Node_186 node_186 = Node_186();

typedef xod__core__any::Node Node_187;
Node_187 node_187 = Node_187();

typedef xod__core__any::Node Node_188;
Node_188 node_188 = Node_188();

typedef xod__core__any::Node Node_189;
Node_189 node_189 = Node_189();

typedef xod__math__map::Node Node_190;
Node_190 node_190 = Node_190(0);

typedef xod__gpio__pwm_write::Node<node_26_output_VAL> Node_191;
Node_191 node_191 = Node_191();

typedef xod__core__gate__pulse::Node Node_192;
Node_192 node_192 = Node_192();

typedef xod__core__gate__pulse::Node Node_193;
Node_193 node_193 = Node_193();

typedef xod__core__pulse_on_change__number::Node Node_194;
Node_194 node_194 = Node_194();

typedef xod__gpio__pwm_write::Node<node_24_output_VAL> Node_195;
Node_195 node_195 = Node_195();

typedef xod_dev__text_lcd__print_at__text_lcd_i2c_device::Node Node_196;
Node_196 node_196 = Node_196({ /* xod-dev/text-lcd/text-lcd-i2c-device */ });

typedef xod__core__any::Node Node_197;
Node_197 node_197 = Node_197();

typedef xod__core__any::Node Node_198;
Node_198 node_198 = Node_198();

typedef xod__core__any::Node Node_199;
Node_199 node_199 = Node_199();

typedef xod__core__gate__pulse::Node Node_200;
Node_200 node_200 = Node_200();

typedef xod_dev__servo__rotate::Node<Node_85::typeof_DEV> Node_201;
Node_201 node_201 = Node_201({ /* xod-dev/servo/servo-device */ });

typedef xod__core__defer__number::Node Node_202;
Node_202 node_202 = Node_202(0);

typedef xod__core__defer__pulse::Node Node_203;
Node_203 node_203 = Node_203();

typedef xod__core__defer__number::Node Node_204;
Node_204 node_204 = Node_204(0);

#if defined(XOD_DEBUG) || defined(XOD_SIMULATION)
namespace detail {
void handleDebugProtocolMessages() {
    bool rewindToEol = true;

    if (
      XOD_DEBUG_SERIAL.available() > 0 &&
      XOD_DEBUG_SERIAL.find("+XOD:", 5)
    ) {
        int tweakedNodeId = XOD_DEBUG_SERIAL.parseInt();

        switch (tweakedNodeId) {
        }

        if (rewindToEol)
            XOD_DEBUG_SERIAL.find('\n');
    }
}
} // namespace detail
#endif

// Copy values bound to `tweak-string`s outputs
// directly into buffers instead of wasting memory
// on XStringCString with initial values
void initializeTweakStrings() {
}

void handleDefers() {
    {
        if (g_transaction.node_202_isNodeDirty) {
            bool error_input_IN = false;
            error_input_IN |= node_203.errors.output_OUT;

            XOD_TRACE_F("Trigger defer node #");
            XOD_TRACE_LN(202);

            Node_202::ContextObject ctxObj;

            ctxObj._input_IN = node_157._output_MEM;

            ctxObj._error_input_IN = error_input_IN;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            Node_202::NodeErrors previousErrors = node_202.errors;

            node_202.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_202_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            if (previousErrors.flags != node_202.errors.flags) {
                detail::printErrorToDebugSerial(202, node_202.errors.flags);

                // if an error was just raised or cleared from an output,
                // mark nearest downstream error catchers as dirty
                if (node_202.errors.output_OUT != previousErrors.output_OUT) {
                    g_transaction.node_202_isNodeDirty = true;
                    g_transaction.node_204_isNodeDirty = true;
                }

            }

            // mark downstream nodes dirty
            g_transaction.node_107_isNodeDirty |= g_transaction.node_202_isOutputDirty_OUT;
            g_transaction.node_116_isNodeDirty |= g_transaction.node_202_isOutputDirty_OUT;

            g_transaction.node_202_isNodeDirty = false;
        }

        // propagate the error hold by the defer node
        if (node_202.errors.flags) {
            if (node_202.errors.output_OUT) {
                g_transaction.node_107_hasUpstreamError = true;
                g_transaction.node_116_hasUpstreamError = true;
            }
        }
    }
    {
        if (g_transaction.node_203_isNodeDirty) {

            XOD_TRACE_F("Trigger defer node #");
            XOD_TRACE_LN(203);

            Node_203::ContextObject ctxObj;
            ctxObj._isInputDirty_IN = false;

            ctxObj._error_input_IN = 0;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            Node_203::NodeErrors previousErrors = node_203.errors;

            node_203.errors.output_OUT = false;

            node_203.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_203_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            if (previousErrors.flags != node_203.errors.flags) {
                detail::printErrorToDebugSerial(203, node_203.errors.flags);

                // if an error was just raised or cleared from an output,
                // mark nearest downstream error catchers as dirty
                if (node_203.errors.output_OUT != previousErrors.output_OUT) {
                    g_transaction.node_202_isNodeDirty = true;
                    g_transaction.node_204_isNodeDirty = true;
                    g_transaction.node_203_isNodeDirty = true;
                }

                // if a pulse output was cleared from error, mark downstream nodes as dirty
                // (no matter if a pulse was emitted or not)
                if (previousErrors.output_OUT && !node_203.errors.output_OUT) {
                    g_transaction.node_132_isNodeDirty = true;
                }
            }

            // mark downstream nodes dirty
            g_transaction.node_132_isNodeDirty |= g_transaction.node_203_isOutputDirty_OUT;

            g_transaction.node_203_isNodeDirty = false;
        }

        // propagate the error hold by the defer node
        if (node_203.errors.flags) {
            if (node_203.errors.output_OUT) {
                g_transaction.node_132_hasUpstreamError = true;
            }
        }
    }
    {
        if (g_transaction.node_204_isNodeDirty) {
            bool error_input_IN = false;
            error_input_IN |= node_203.errors.output_OUT;
            error_input_IN |= node_202.errors.output_OUT;

            XOD_TRACE_F("Trigger defer node #");
            XOD_TRACE_LN(204);

            Node_204::ContextObject ctxObj;

            ctxObj._input_IN = node_180._output_MEM;

            ctxObj._error_input_IN = error_input_IN;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            Node_204::NodeErrors previousErrors = node_204.errors;

            node_204.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_204_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            if (previousErrors.flags != node_204.errors.flags) {
                detail::printErrorToDebugSerial(204, node_204.errors.flags);

                // if an error was just raised or cleared from an output,
                // mark nearest downstream error catchers as dirty
                if (node_204.errors.output_OUT != previousErrors.output_OUT) {
                    g_transaction.node_204_isNodeDirty = true;
                }

            }

            // mark downstream nodes dirty
            g_transaction.node_155_isNodeDirty |= g_transaction.node_204_isOutputDirty_OUT;

            g_transaction.node_204_isNodeDirty = false;
        }

        // propagate the error hold by the defer node
        if (node_204.errors.flags) {
            if (node_204.errors.output_OUT) {
                g_transaction.node_155_hasUpstreamError = true;
            }
        }
    }
}

void runTransaction() {
    g_transactionTime = millis();

    XOD_TRACE_F("Transaction started, t=");
    XOD_TRACE_LN(g_transactionTime);

#if defined(XOD_DEBUG) || defined(XOD_SIMULATION)
    detail::handleDebugProtocolMessages();
#endif

    // Check for timeouts
    g_transaction.node_109_isNodeDirty |= detail::isTimedOut(&node_109);
    g_transaction.node_113_isNodeDirty |= detail::isTimedOut(&node_113);
    g_transaction.node_137_isNodeDirty |= detail::isTimedOut(&node_137);
    g_transaction.node_139_isNodeDirty |= detail::isTimedOut(&node_139);
    g_transaction.node_142_isNodeDirty |= detail::isTimedOut(&node_142);
    g_transaction.node_150_isNodeDirty |= detail::isTimedOut(&node_150);
    if (node_79.isSetImmediate) {
      node_79.isSetImmediate = false;
      g_transaction.node_79_isNodeDirty = true;
    }
    if (node_202.isSetImmediate) {
      node_202.isSetImmediate = false;
      g_transaction.node_202_isNodeDirty = true;
    }
    if (node_203.isSetImmediate) {
      node_203.isSetImmediate = false;
      g_transaction.node_203_isNodeDirty = true;
    }
    if (node_204.isSetImmediate) {
      node_204.isSetImmediate = false;
      g_transaction.node_204_isNodeDirty = true;
    }

    if (isSettingUp()) {
        initializeTweakStrings();
    } else {
        // defer-* nodes are always at the very bottom of the graph, so no one will
        // recieve values emitted by them. We must evaluate them before everybody
        // else to give them a chance to emit values.
        //
        // If trigerred, keep only output dirty, not the node itself, so it will
        // evaluate on the regular pass only if it receives a new value again.
        g_isEarlyDeferPass = true;
        handleDefers();
        g_isEarlyDeferPass = false;
    }

    // Evaluate all dirty nodes
    { // xod__core__continuously #79
        if (g_transaction.node_79_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(79);

            Node_79::ContextObject ctxObj;

            // copy data from upstream nodes into context

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_TICK = false;

            node_79.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_79_isOutputDirty_TICK = ctxObj._isOutputDirty_TICK;

            // mark downstream nodes dirty
            g_transaction.node_93_isNodeDirty |= g_transaction.node_79_isOutputDirty_TICK;
            g_transaction.node_94_isNodeDirty |= g_transaction.node_79_isOutputDirty_TICK;
            g_transaction.node_95_isNodeDirty |= g_transaction.node_79_isOutputDirty_TICK;
            g_transaction.node_96_isNodeDirty |= g_transaction.node_79_isOutputDirty_TICK;
            g_transaction.node_97_isNodeDirty |= g_transaction.node_79_isOutputDirty_TICK;
        }

    }
    { // xod__core__boot #80
        if (g_transaction.node_80_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(80);

            Node_80::ContextObject ctxObj;

            // copy data from upstream nodes into context

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_BOOT = false;

            node_80.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_80_isOutputDirty_BOOT = ctxObj._isOutputDirty_BOOT;

            // mark downstream nodes dirty
            g_transaction.node_99_isNodeDirty |= g_transaction.node_80_isOutputDirty_BOOT;
            g_transaction.node_127_isNodeDirty |= g_transaction.node_80_isOutputDirty_BOOT;
            g_transaction.node_130_isNodeDirty |= g_transaction.node_80_isOutputDirty_BOOT;
            g_transaction.node_162_isNodeDirty |= g_transaction.node_80_isOutputDirty_BOOT;
            g_transaction.node_175_isNodeDirty |= g_transaction.node_80_isOutputDirty_BOOT;
            g_transaction.node_182_isNodeDirty |= g_transaction.node_80_isOutputDirty_BOOT;
            g_transaction.node_184_isNodeDirty |= g_transaction.node_80_isOutputDirty_BOOT;
            g_transaction.node_197_isNodeDirty |= g_transaction.node_80_isOutputDirty_BOOT;
        }

    }
    { // xod__core__multiply #81
        if (g_transaction.node_81_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(81);

            Node_81::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_17_output_VAL;
            ctxObj._input_IN2 = node_18_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_81.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_98_isNodeDirty = true;
            g_transaction.node_166_isNodeDirty = true;
        }

    }
    { // xod__core__pulse_on_change__boolean #82
        if (g_transaction.node_82_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(82);

            Node_82::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_35_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_82.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_82_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_99_isNodeDirty |= g_transaction.node_82_isOutputDirty_OUT;
        }

    }
    { // xod_dev__text_lcd__text_lcd_i2c_device #83
        if (g_transaction.node_83_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(83);

            Node_83::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_ADDR = node_41_output_VAL;
            ctxObj._input_COLS = node_42_output_VAL;
            ctxObj._input_ROWS = node_43_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_DEV = false;

            Node_83::NodeErrors previousErrors = node_83.errors;

            node_83.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_83_isOutputDirty_DEV = ctxObj._isOutputDirty_DEV;

            if (previousErrors.flags != node_83.errors.flags) {
                detail::printErrorToDebugSerial(83, node_83.errors.flags);

                // if an error was just raised or cleared from an output,
                // mark nearest downstream error catchers as dirty
                if (node_83.errors.output_DEV != previousErrors.output_DEV) {
                }

                // if a pulse output was cleared from error, mark downstream nodes as dirty
                // (no matter if a pulse was emitted or not)
            }

            // mark downstream nodes dirty
            g_transaction.node_123_isNodeDirty |= g_transaction.node_83_isOutputDirty_DEV;
        }

        // propagate errors hold by the node outputs
        if (node_83.errors.flags) {
            if (node_83.errors.output_DEV) {
                g_transaction.node_123_hasUpstreamError = true;
            }
        }
    }
    { // xod__core__divide #84
        if (g_transaction.node_84_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(84);

            Node_84::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_60_output_VAL;
            ctxObj._input_IN2 = node_61_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_84.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_148_isNodeDirty = true;
        }

    }
    { // xod_dev__servo__servo_device #85
        if (g_transaction.node_85_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(85);

            Node_85::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_Pmin = node_69_output_VAL;
            ctxObj._input_Pmax = node_70_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_DEV = false;

            Node_85::NodeErrors previousErrors = node_85.errors;

            node_85.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            if (previousErrors.flags != node_85.errors.flags) {
                detail::printErrorToDebugSerial(85, node_85.errors.flags);

                // if an error was just raised or cleared from an output,
                // mark nearest downstream error catchers as dirty
                if (node_85.errors.output_DEV != previousErrors.output_DEV) {
                }

                // if a pulse output was cleared from error, mark downstream nodes as dirty
                // (no matter if a pulse was emitted or not)
            }

            // mark downstream nodes dirty
        }

        // propagate errors hold by the node outputs
        if (node_85.errors.flags) {
            if (node_85.errors.output_DEV) {
                g_transaction.node_201_hasUpstreamError = true;
            }
        }
    }
    { // xod__core__cast_to_pulse__boolean #86
        if (g_transaction.node_86_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(86);

            Node_86::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_72_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_86.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_86_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_187_isNodeDirty |= g_transaction.node_86_isOutputDirty_OUT;
        }

    }
    { // xod__core__cast_to_pulse__boolean #87
        if (g_transaction.node_87_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(87);

            Node_87::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_73_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_87.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_87_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_181_isNodeDirty |= g_transaction.node_87_isOutputDirty_OUT;
        }

    }
    { // xod__core__cast_to_pulse__boolean #88
        if (g_transaction.node_88_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(88);

            Node_88::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_74_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_88.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_88_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_104_isNodeDirty |= g_transaction.node_88_isOutputDirty_OUT;
        }

    }
    { // xod__core__cast_to_pulse__boolean #89
        if (g_transaction.node_89_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(89);

            Node_89::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_75_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_89.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_89_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_170_isNodeDirty |= g_transaction.node_89_isOutputDirty_OUT;
        }

    }
    { // xod__core__cast_to_pulse__boolean #90
        if (g_transaction.node_90_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(90);

            Node_90::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_76_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_90.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_90_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_189_isNodeDirty |= g_transaction.node_90_isOutputDirty_OUT;
        }

    }
    { // xod__core__cast_to_pulse__boolean #91
        if (g_transaction.node_91_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(91);

            Node_91::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_77_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_91.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_91_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_134_isNodeDirty |= g_transaction.node_91_isOutputDirty_OUT;
        }

    }
    { // xod__core__cast_to_pulse__boolean #92
        if (g_transaction.node_92_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(92);

            Node_92::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_78_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_92.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_92_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_199_isNodeDirty |= g_transaction.node_92_isOutputDirty_OUT;
        }

    }
    { // xod__gpio__analog_read #93
        if (g_transaction.node_93_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(93);

            Node_93::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_UPD = g_transaction.node_79_isOutputDirty_TICK;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_VAL = false;
            ctxObj._isOutputDirty_DONE = false;

            node_93.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_93_isOutputDirty_VAL = ctxObj._isOutputDirty_VAL;

            // mark downstream nodes dirty
            g_transaction.node_100_isNodeDirty |= g_transaction.node_93_isOutputDirty_VAL;
        }

    }
    { // xod__gpio__digital_read_pullup #94
        if (g_transaction.node_94_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(94);

            Node_94::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_UPD = g_transaction.node_79_isOutputDirty_TICK;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_SIG = false;
            ctxObj._isOutputDirty_DONE = false;

            node_94.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_94_isOutputDirty_SIG = ctxObj._isOutputDirty_SIG;

            // mark downstream nodes dirty
            g_transaction.node_101_isNodeDirty |= g_transaction.node_94_isOutputDirty_SIG;
        }

    }
    { // xod__gpio__analog_read #95
        if (g_transaction.node_95_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(95);

            Node_95::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_UPD = g_transaction.node_79_isOutputDirty_TICK;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_VAL = false;
            ctxObj._isOutputDirty_DONE = false;

            node_95.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_95_isOutputDirty_VAL = ctxObj._isOutputDirty_VAL;

            // mark downstream nodes dirty
            g_transaction.node_102_isNodeDirty |= g_transaction.node_95_isOutputDirty_VAL;
        }

    }
    { // xod__gpio__digital_read_pullup #96
        if (g_transaction.node_96_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(96);

            Node_96::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_UPD = g_transaction.node_79_isOutputDirty_TICK;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_SIG = false;
            ctxObj._isOutputDirty_DONE = false;

            node_96.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_96_isOutputDirty_SIG = ctxObj._isOutputDirty_SIG;

            // mark downstream nodes dirty
            g_transaction.node_103_isNodeDirty |= g_transaction.node_96_isOutputDirty_SIG;
        }

    }
    { // xod__gpio__analog_read #97
        if (g_transaction.node_97_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(97);

            Node_97::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_UPD = g_transaction.node_79_isOutputDirty_TICK;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_VAL = false;
            ctxObj._isOutputDirty_DONE = false;

            node_97.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_97_isOutputDirty_VAL = ctxObj._isOutputDirty_VAL;

            // mark downstream nodes dirty
            g_transaction.node_115_isNodeDirty |= g_transaction.node_97_isOutputDirty_VAL;
        }

    }
    { // xod__core__subtract #98
        if (g_transaction.node_98_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(98);

            Node_98::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_21_output_VAL;
            ctxObj._input_IN2 = node_81._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_98.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_174_isNodeDirty = true;
        }

    }
    { // xod__core__any #99
        if (g_transaction.node_99_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(99);

            Node_99::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_82_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_80_isOutputDirty_BOOT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_99.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_99_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_104_isNodeDirty |= g_transaction.node_99_isOutputDirty_OUT;
        }

    }
    { // xod__math__map #100
        if (g_transaction.node_100_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(100);

            Node_100::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_X = node_93._output_VAL;
            ctxObj._input_Smin = node_1_output_VAL;
            ctxObj._input_Smax = node_2_output_VAL;
            ctxObj._input_Tmin = node_3_output_VAL;
            ctxObj._input_Tmax = node_4_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_100.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_105_isNodeDirty = true;
            g_transaction.node_106_isNodeDirty = true;
            g_transaction.node_107_isNodeDirty = true;
            g_transaction.node_108_isNodeDirty = true;
            g_transaction.node_116_isNodeDirty = true;
        }

    }
    { // xod__core__not #101
        if (g_transaction.node_101_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(101);

            Node_101::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_94._output_SIG;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_101.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_109_isNodeDirty = true;
        }

    }
    { // xod__math__map #102
        if (g_transaction.node_102_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(102);

            Node_102::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_X = node_95._output_VAL;
            ctxObj._input_Smin = node_9_output_VAL;
            ctxObj._input_Smax = node_10_output_VAL;
            ctxObj._input_Tmin = node_11_output_VAL;
            ctxObj._input_Tmax = node_12_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_102.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_110_isNodeDirty = true;
            g_transaction.node_111_isNodeDirty = true;
            g_transaction.node_112_isNodeDirty = true;
        }

    }
    { // xod__core__not #103
        if (g_transaction.node_103_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(103);

            Node_103::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_96._output_SIG;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_103.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_113_isNodeDirty = true;
        }

    }
    { // xod__core__any #104
        if (g_transaction.node_104_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(104);

            Node_104::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_99_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_88_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_104.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_104_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_114_isNodeDirty |= g_transaction.node_104_isOutputDirty_OUT;
        }

    }
    { // xod__core__less #105
        if (g_transaction.node_105_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(105);

            Node_105::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_100._output_OUT;
            ctxObj._input_IN2 = node_8_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_105.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_115_isNodeDirty = true;
        }

    }
    { // xod__core__less #106
        if (g_transaction.node_106_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(106);

            Node_106::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_100._output_OUT;
            ctxObj._input_IN2 = node_32_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_106.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_120_isNodeDirty = true;
        }

    }
    { // xod__core__less #107

        if (g_transaction.node_107_hasUpstreamError) {
            g_transaction.node_116_hasUpstreamError = true;
            g_transaction.node_155_hasUpstreamError = true;
        } else if (g_transaction.node_107_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(107);

            Node_107::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_202._output_OUT;
            ctxObj._input_IN2 = node_100._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_107.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_116_isNodeDirty = true;
            g_transaction.node_155_isNodeDirty = true;
        }

    }
    { // xod__core__cast_to_string__number #108
        if (g_transaction.node_108_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(108);

            Node_108::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_100._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_108.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_117_isNodeDirty = true;
        }

    }
    { // xod__core__debounce__boolean #109
        if (g_transaction.node_109_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(109);

            Node_109::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_ST = node_101._output_OUT;
            ctxObj._input_Ts = node_6_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_109.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_109_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_118_isNodeDirty |= g_transaction.node_109_isOutputDirty_OUT;
            g_transaction.node_119_isNodeDirty |= g_transaction.node_109_isOutputDirty_OUT;
        }

    }
    { // xod__core__less #110
        if (g_transaction.node_110_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(110);

            Node_110::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_102._output_OUT;
            ctxObj._input_IN2 = node_14_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_110.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_120_isNodeDirty = true;
        }

    }
    { // xod__core__greater #111
        if (g_transaction.node_111_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(111);

            Node_111::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_102._output_OUT;
            ctxObj._input_IN2 = node_50_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_111.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_121_isNodeDirty = true;
        }

    }
    { // xod__core__cast_to_string__number #112
        if (g_transaction.node_112_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(112);

            Node_112::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_102._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_112.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_131_isNodeDirty = true;
        }

    }
    { // xod__core__debounce__boolean #113
        if (g_transaction.node_113_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(113);

            Node_113::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_ST = node_103._output_OUT;
            ctxObj._input_Ts = node_29_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_113.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_113_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_122_isNodeDirty |= g_transaction.node_113_isOutputDirty_OUT;
        }

    }
    { // xod__core__gate__pulse #114
        if (g_transaction.node_114_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(114);

            Node_114::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_EN = node_34_output_VAL;

            ctxObj._isInputDirty_IN = g_transaction.node_104_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_114.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_114_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_123_isNodeDirty |= g_transaction.node_114_isOutputDirty_OUT;
        }

    }
    { // xod__core__if_else__number #115
        if (g_transaction.node_115_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(115);

            Node_115::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_COND = node_105._output_OUT;
            ctxObj._input_T = node_97._output_VAL;
            ctxObj._input_F = node_0_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_115.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_124_isNodeDirty = true;
            g_transaction.node_125_isNodeDirty = true;
        }

    }
    { // xod__core__if_else__number #116

        if (g_transaction.node_116_hasUpstreamError) {
            g_transaction.node_141_hasUpstreamError = true;
        } else if (g_transaction.node_116_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(116);

            Node_116::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_COND = node_107._output_OUT;
            ctxObj._input_T = node_100._output_OUT;
            ctxObj._input_F = node_202._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_116.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_141_isNodeDirty = true;
        }

    }
    { // xod__core__concat #117
        if (g_transaction.node_117_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(117);

            Node_117::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_53_output_VAL;
            ctxObj._input_IN2 = node_108._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_117.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_126_isNodeDirty = true;
        }

    }
    { // xod__core__pulse_on_true #118
        if (g_transaction.node_118_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(118);

            Node_118::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_109._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_118.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_118_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_127_isNodeDirty |= g_transaction.node_118_isOutputDirty_OUT;
        }

    }
    { // xod__core__not #119
        if (g_transaction.node_119_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(119);

            Node_119::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_109._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_119.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_128_isNodeDirty = true;
        }

    }
    { // xod__core__and #120
        if (g_transaction.node_120_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(120);

            Node_120::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_110._output_OUT;
            ctxObj._input_IN2 = node_106._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_120.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_133_isNodeDirty = true;
        }

    }
    { // xod__core__if_else__string #121
        if (g_transaction.node_121_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(121);

            Node_121::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_COND = node_111._output_OUT;
            ctxObj._input_T = node_51_output_VAL;
            ctxObj._input_F = node_52_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_121.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_138_isNodeDirty = true;
        }

    }
    { // xod__core__cast_to_pulse__boolean #122
        if (g_transaction.node_122_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(122);

            Node_122::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_113._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_122.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_122_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_129_isNodeDirty |= g_transaction.node_122_isOutputDirty_OUT;
        }

    }
    { // xod_dev__text_lcd__set_backlight #123

        if (g_transaction.node_123_hasUpstreamError) {
            g_transaction.node_183_hasUpstreamError = true;
            g_transaction.node_188_hasUpstreamError = true;
        } else if (g_transaction.node_123_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(123);

            Node_123::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_DEV = node_83._output_DEV;
            ctxObj._input_BL = node_48_output_VAL;

            ctxObj._isInputDirty_DO = g_transaction.node_114_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_DEVU0027 = false;
            ctxObj._isOutputDirty_DONE = false;

            if (isSettingUp()) {
                node_123.emitValue<Node_123::output_DEVU0027>(&ctxObj, node_123.getValue<Node_123::input_DEV>(&ctxObj));
            }
            node_123.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_123_isOutputDirty_DEVU0027 = ctxObj._isOutputDirty_DEVU0027;
            g_transaction.node_123_isOutputDirty_DONE = ctxObj._isOutputDirty_DONE;

            // mark downstream nodes dirty
            g_transaction.node_183_isNodeDirty |= g_transaction.node_123_isOutputDirty_DEVU0027;
            g_transaction.node_188_isNodeDirty |= g_transaction.node_123_isOutputDirty_DONE;
        }

    }
    { // xod__math__cube #124
        if (g_transaction.node_124_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(124);

            Node_124::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_115._output_R;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_124.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
        }

    }
    { // xod__core__pulse_on_change__number #125
        if (g_transaction.node_125_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(125);

            Node_125::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_115._output_R;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_125.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_125_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_130_isNodeDirty |= g_transaction.node_125_isOutputDirty_OUT;
        }

    }
    { // xod__core__concat #126
        if (g_transaction.node_126_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(126);

            Node_126::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_117._output_OUT;
            ctxObj._input_IN2 = node_54_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_126.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_131_isNodeDirty = true;
        }

    }
    { // xod__core__any #127
        if (g_transaction.node_127_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(127);

            Node_127::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_118_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_80_isOutputDirty_BOOT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_127.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_127_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_132_isNodeDirty |= g_transaction.node_127_isOutputDirty_OUT;
            g_transaction.node_142_isNodeDirty |= g_transaction.node_127_isOutputDirty_OUT;
            g_transaction.node_148_isNodeDirty |= g_transaction.node_127_isOutputDirty_OUT;
            g_transaction.node_149_isNodeDirty |= g_transaction.node_127_isOutputDirty_OUT;
            g_transaction.node_172_isNodeDirty |= g_transaction.node_127_isOutputDirty_OUT;
            g_transaction.node_173_isNodeDirty |= g_transaction.node_127_isOutputDirty_OUT;
        }

    }
    { // xod__core__pulse_on_true #128
        if (g_transaction.node_128_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(128);

            Node_128::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_119._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_128.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_128_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_135_isNodeDirty |= g_transaction.node_128_isOutputDirty_OUT;
        }

    }
    { // xod__core__flip_flop #129
        if (g_transaction.node_129_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(129);

            Node_129::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_SET = false;
            ctxObj._isInputDirty_RST = false;
            ctxObj._isInputDirty_TGL = g_transaction.node_122_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_MEM = false;

            node_129.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_129_isOutputDirty_MEM = ctxObj._isOutputDirty_MEM;

            // mark downstream nodes dirty
            g_transaction.node_133_isNodeDirty |= g_transaction.node_129_isOutputDirty_MEM;
        }

    }
    { // xod__core__any #130
        if (g_transaction.node_130_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(130);

            Node_130::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_125_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_80_isOutputDirty_BOOT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_130.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_130_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_134_isNodeDirty |= g_transaction.node_130_isOutputDirty_OUT;
        }

    }
    { // xod__core__concat #131
        if (g_transaction.node_131_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(131);

            Node_131::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_126._output_OUT;
            ctxObj._input_IN2 = node_112._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_131.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_154_isNodeDirty = true;
            g_transaction.node_163_isNodeDirty = true;
        }

    }
    { // xod__core__any #132

        if (g_transaction.node_132_hasUpstreamError) {
            g_transaction.node_135_hasUpstreamError = true;
        } else if (g_transaction.node_132_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(132);

            Node_132::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_127_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_203_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_132.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_132_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_135_isNodeDirty |= g_transaction.node_132_isOutputDirty_OUT;
        }

    }
    { // xod__core__or #133
        if (g_transaction.node_133_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(133);

            Node_133::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_129._output_MEM;
            ctxObj._input_IN2 = node_120._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_133.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_136_isNodeDirty = true;
            g_transaction.node_137_isNodeDirty = true;
            g_transaction.node_138_isNodeDirty = true;
            g_transaction.node_139_isNodeDirty = true;
            g_transaction.node_150_isNodeDirty = true;
            g_transaction.node_151_isNodeDirty = true;
            g_transaction.node_161_isNodeDirty = true;
            g_transaction.node_163_isNodeDirty = true;
        }

    }
    { // xod__core__any #134
        if (g_transaction.node_134_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(134);

            Node_134::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_130_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_91_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_134.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_134_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_140_isNodeDirty |= g_transaction.node_134_isOutputDirty_OUT;
        }

    }
    { // xod__core__flip_flop #135

        if (g_transaction.node_135_hasUpstreamError) {
            g_transaction.node_141_hasUpstreamError = true;
            g_transaction.node_142_hasUpstreamError = true;
        } else if (g_transaction.node_135_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(135);

            Node_135::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_SET = false;
            ctxObj._isInputDirty_TGL = g_transaction.node_128_isOutputDirty_OUT;
            ctxObj._isInputDirty_RST = g_transaction.node_132_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_MEM = false;

            node_135.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_135_isOutputDirty_MEM = ctxObj._isOutputDirty_MEM;

            // mark downstream nodes dirty
            g_transaction.node_141_isNodeDirty |= g_transaction.node_135_isOutputDirty_MEM;
            g_transaction.node_142_isNodeDirty |= g_transaction.node_135_isOutputDirty_MEM;
        }

    }
    { // xod__core__not #136
        if (g_transaction.node_136_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(136);

            Node_136::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_133._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_136.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_143_isNodeDirty = true;
        }

    }
    { // xod__core__clock #137
        if (g_transaction.node_137_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(137);

            Node_137::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_EN = node_133._output_OUT;
            ctxObj._input_IVAL = node_28_output_VAL;

            ctxObj._isInputDirty_RST = false;
            ctxObj._isInputDirty_EN = true;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_TICK = false;

            node_137.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_137_isOutputDirty_TICK = ctxObj._isOutputDirty_TICK;

            // mark downstream nodes dirty
            g_transaction.node_144_isNodeDirty |= g_transaction.node_137_isOutputDirty_TICK;
        }

    }
    { // xod__core__if_else__string #138
        if (g_transaction.node_138_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(138);

            Node_138::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_COND = node_133._output_OUT;
            ctxObj._input_T = node_55_output_VAL;
            ctxObj._input_F = node_121._output_R;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_138.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_145_isNodeDirty = true;
        }

    }
    { // xod__core__clock #139
        if (g_transaction.node_139_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(139);

            Node_139::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_EN = node_133._output_OUT;
            ctxObj._input_IVAL = node_56_output_VAL;

            ctxObj._isInputDirty_RST = false;
            ctxObj._isInputDirty_EN = true;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_TICK = false;

            node_139.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_139_isOutputDirty_TICK = ctxObj._isOutputDirty_TICK;

            // mark downstream nodes dirty
            g_transaction.node_146_isNodeDirty |= g_transaction.node_139_isOutputDirty_TICK;
        }

    }
    { // xod__core__gate__pulse #140
        if (g_transaction.node_140_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(140);

            Node_140::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_EN = node_67_output_VAL;

            ctxObj._isInputDirty_IN = g_transaction.node_134_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_140.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_140_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_147_isNodeDirty |= g_transaction.node_140_isOutputDirty_OUT;
        }

    }
    { // xod__core__if_else__number #141

        if (g_transaction.node_141_hasUpstreamError) {
            g_transaction.node_157_hasUpstreamError = true;
        } else if (g_transaction.node_141_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(141);

            Node_141::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_COND = node_135._output_MEM;
            ctxObj._input_T = node_116._output_R;
            ctxObj._input_F = node_57_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_141.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
        }

    }
    { // xod__core__clock #142

        if (g_transaction.node_142_hasUpstreamError) {
            g_transaction.node_148_hasUpstreamError = true;
            g_transaction.node_149_hasUpstreamError = true;
            g_transaction.node_164_hasUpstreamError = true;
        } else if (g_transaction.node_142_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(142);

            Node_142::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_EN = node_135._output_MEM;
            ctxObj._input_IVAL = node_58_output_VAL;

            ctxObj._isInputDirty_EN = g_transaction.node_135_isOutputDirty_MEM;
            ctxObj._isInputDirty_RST = g_transaction.node_127_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_TICK = false;

            node_142.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_142_isOutputDirty_TICK = ctxObj._isOutputDirty_TICK;

            // mark downstream nodes dirty
            g_transaction.node_148_isNodeDirty |= g_transaction.node_142_isOutputDirty_TICK;
            g_transaction.node_149_isNodeDirty |= g_transaction.node_142_isOutputDirty_TICK;
            g_transaction.node_164_isNodeDirty |= g_transaction.node_142_isOutputDirty_TICK;
        }

    }
    { // xod__core__pulse_on_true #143
        if (g_transaction.node_143_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(143);

            Node_143::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_136._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_143.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_143_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_150_isNodeDirty |= g_transaction.node_143_isOutputDirty_OUT;
        }

    }
    { // xod__core__flip_flop #144
        if (g_transaction.node_144_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(144);

            Node_144::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_SET = false;
            ctxObj._isInputDirty_RST = false;
            ctxObj._isInputDirty_TGL = g_transaction.node_137_isOutputDirty_TICK;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_MEM = false;

            node_144.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_144_isOutputDirty_MEM = ctxObj._isOutputDirty_MEM;

            // mark downstream nodes dirty
            g_transaction.node_151_isNodeDirty |= g_transaction.node_144_isOutputDirty_MEM;
            g_transaction.node_152_isNodeDirty |= g_transaction.node_144_isOutputDirty_MEM;
        }

    }
    { // xod__core__if_error__string #145
        if (g_transaction.node_145_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(145);

            Node_145::ContextObject ctxObj;

            ctxObj._error_input_IN = 0;
            ctxObj._error_input_DEF = 0;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_138._output_R;
            ctxObj._input_DEF = node_37_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            Node_145::NodeErrors previousErrors = node_145.errors;

            node_145.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_145_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            if (previousErrors.flags != node_145.errors.flags) {
                detail::printErrorToDebugSerial(145, node_145.errors.flags);

                // if an error was just raised or cleared from an output,
                // mark nearest downstream error catchers as dirty
                if (node_145.errors.output_OUT != previousErrors.output_OUT) {
                }

                // if a pulse output was cleared from error, mark downstream nodes as dirty
                // (no matter if a pulse was emitted or not)
            }

            // mark downstream nodes dirty
            g_transaction.node_153_isNodeDirty |= g_transaction.node_145_isOutputDirty_OUT;
            g_transaction.node_183_isNodeDirty |= g_transaction.node_145_isOutputDirty_OUT;
        }

        // propagate errors hold by the node outputs
        if (node_145.errors.flags) {
            if (node_145.errors.output_OUT) {
                g_transaction.node_153_hasUpstreamError = true;
                g_transaction.node_183_hasUpstreamError = true;
            }
        }
    }
    { // xod__core__flip_flop #146
        if (g_transaction.node_146_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(146);

            Node_146::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_SET = false;
            ctxObj._isInputDirty_RST = false;
            ctxObj._isInputDirty_TGL = g_transaction.node_139_isOutputDirty_TICK;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_MEM = false;

            node_146.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_146_isOutputDirty_MEM = ctxObj._isOutputDirty_MEM;

            // mark downstream nodes dirty
            g_transaction.node_154_isNodeDirty |= g_transaction.node_146_isOutputDirty_MEM;
        }

    }
    { // xod__gpio__pwm_write #147
        if (g_transaction.node_147_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(147);

            Node_147::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_DUTY = node_124._output_OUT;

            ctxObj._isInputDirty_UPD = g_transaction.node_140_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_DONE = false;

            node_147.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
        }

    }
    { // xod__core__count #148

        if (g_transaction.node_148_hasUpstreamError) {
            g_transaction.node_155_hasUpstreamError = true;
            g_transaction.node_156_hasUpstreamError = true;
            g_transaction.node_185_hasUpstreamError = true;
        } else if (g_transaction.node_148_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(148);

            Node_148::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_STEP = node_84._output_OUT;

            ctxObj._isInputDirty_INC = g_transaction.node_142_isOutputDirty_TICK;
            ctxObj._isInputDirty_RST = g_transaction.node_127_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_148.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_148_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_155_isNodeDirty |= g_transaction.node_148_isOutputDirty_OUT;
            g_transaction.node_156_isNodeDirty |= g_transaction.node_148_isOutputDirty_OUT;
            g_transaction.node_185_isNodeDirty |= g_transaction.node_148_isOutputDirty_OUT;
        }

    }
    { // xod__core__any #149

        if (g_transaction.node_149_hasUpstreamError) {
            g_transaction.node_157_hasUpstreamError = true;
        } else if (g_transaction.node_149_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(149);

            Node_149::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_127_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_142_isOutputDirty_TICK;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_149.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_149_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_157_isNodeDirty |= g_transaction.node_149_isOutputDirty_OUT;
        }

    }
    { // xod__core__square_wave #150
        if (g_transaction.node_150_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(150);

            Node_150::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_T = node_15_output_VAL;
            ctxObj._input_DUTY = node_16_output_VAL;
            ctxObj._input_EN = node_133._output_OUT;

            ctxObj._isInputDirty_RST = g_transaction.node_143_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;
            ctxObj._isOutputDirty_N = false;

            node_150.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_150_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_158_isNodeDirty |= g_transaction.node_150_isOutputDirty_OUT;
            g_transaction.node_159_isNodeDirty |= g_transaction.node_150_isOutputDirty_OUT;
        }

    }
    { // xod__core__and #151
        if (g_transaction.node_151_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(151);

            Node_151::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_133._output_OUT;
            ctxObj._input_IN2 = node_144._output_MEM;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_151.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_160_isNodeDirty = true;
        }

    }
    { // xod__core__not #152
        if (g_transaction.node_152_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(152);

            Node_152::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_144._output_MEM;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_152.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_161_isNodeDirty = true;
        }

    }
    { // xod__core__pulse_on_change__string #153

        if (g_transaction.node_153_hasUpstreamError) {
            g_transaction.node_162_hasUpstreamError = true;
        } else if (g_transaction.node_153_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(153);

            Node_153::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_145._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_153.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_153_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_162_isNodeDirty |= g_transaction.node_153_isOutputDirty_OUT;
        }

    }
    { // xod__core__if_else__string #154
        if (g_transaction.node_154_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(154);

            Node_154::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_COND = node_146._output_MEM;
            ctxObj._input_T = node_33_output_VAL;
            ctxObj._input_F = node_131._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_154.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_163_isNodeDirty = true;
        }

    }
    { // xod__core__if_else__number #155

        if (g_transaction.node_155_hasUpstreamError) {
            g_transaction.node_180_hasUpstreamError = true;
        } else if (g_transaction.node_155_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(155);

            Node_155::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_COND = node_107._output_OUT;
            ctxObj._input_T = node_148._output_OUT;
            ctxObj._input_F = node_204._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_155.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
        }

    }
    { // xod__core__less #156

        if (g_transaction.node_156_hasUpstreamError) {
            g_transaction.node_164_hasUpstreamError = true;
        } else if (g_transaction.node_156_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(156);

            Node_156::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_148._output_OUT;
            ctxObj._input_IN2 = node_59_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_156.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
        }

    }
    { // xod__core__buffer__number #157

        if (g_transaction.node_157_hasUpstreamError) {
            g_transaction.node_202_hasUpstreamError = true;
        } else if (g_transaction.node_157_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(157);

            Node_157::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_NEW = node_141._output_R;

            ctxObj._isInputDirty_UPD = g_transaction.node_149_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_MEM = false;

            node_157.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_157_isOutputDirty_MEM = ctxObj._isOutputDirty_MEM;

            // mark downstream nodes dirty
            g_transaction.node_202_isNodeDirty |= g_transaction.node_157_isOutputDirty_MEM;
        }

    }
    { // xod__core__not #158
        if (g_transaction.node_158_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(158);

            Node_158::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_150._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_158.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_165_isNodeDirty = true;
        }

    }
    { // xod__core__cast_to_pulse__boolean #159
        if (g_transaction.node_159_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(159);

            Node_159::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_150._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_159.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_159_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_166_isNodeDirty |= g_transaction.node_159_isOutputDirty_OUT;
        }

    }
    { // xod__core__cast_to_number__boolean #160
        if (g_transaction.node_160_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(160);

            Node_160::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_151._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_160.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_167_isNodeDirty = true;
            g_transaction.node_168_isNodeDirty = true;
        }

    }
    { // xod__core__and #161
        if (g_transaction.node_161_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(161);

            Node_161::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_133._output_OUT;
            ctxObj._input_IN2 = node_152._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_161.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_169_isNodeDirty = true;
        }

    }
    { // xod__core__any #162

        if (g_transaction.node_162_hasUpstreamError) {
            g_transaction.node_170_hasUpstreamError = true;
        } else if (g_transaction.node_162_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(162);

            Node_162::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_153_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_80_isOutputDirty_BOOT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_162.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_162_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_170_isNodeDirty |= g_transaction.node_162_isOutputDirty_OUT;
        }

    }
    { // xod__core__if_else__string #163
        if (g_transaction.node_163_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(163);

            Node_163::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_COND = node_133._output_OUT;
            ctxObj._input_T = node_154._output_R;
            ctxObj._input_F = node_131._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_163.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_171_isNodeDirty = true;
        }

    }
    { // xod__core__branch #164

        if (g_transaction.node_164_hasUpstreamError) {
            g_transaction.node_172_hasUpstreamError = true;
            g_transaction.node_173_hasUpstreamError = true;
            g_transaction.node_203_hasUpstreamError = true;
        } else if (g_transaction.node_164_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(164);

            Node_164::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_GATE = node_156._output_OUT;

            ctxObj._isInputDirty_TRIG = g_transaction.node_142_isOutputDirty_TICK;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_T = false;
            ctxObj._isOutputDirty_F = false;

            node_164.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_164_isOutputDirty_T = ctxObj._isOutputDirty_T;
            g_transaction.node_164_isOutputDirty_F = ctxObj._isOutputDirty_F;

            // mark downstream nodes dirty
            g_transaction.node_172_isNodeDirty |= g_transaction.node_164_isOutputDirty_T;
            g_transaction.node_173_isNodeDirty |= g_transaction.node_164_isOutputDirty_F;
            g_transaction.node_203_isNodeDirty |= g_transaction.node_164_isOutputDirty_F;
        }

    }
    { // xod__core__cast_to_pulse__boolean #165
        if (g_transaction.node_165_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(165);

            Node_165::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_158._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_165.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_165_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_174_isNodeDirty |= g_transaction.node_165_isOutputDirty_OUT;
        }

    }
    { // ____play_note #166
        if (g_transaction.node_166_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(166);

            Node_166::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_FREQ = node_23_output_VAL;
            ctxObj._input_DUR = node_81._output_OUT;

            ctxObj._isInputDirty_UPD = g_transaction.node_159_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_166.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
        }

    }
    { // xod__math__cube #167
        if (g_transaction.node_167_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(167);

            Node_167::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_160._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_167.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
        }

    }
    { // xod__core__pulse_on_change__number #168
        if (g_transaction.node_168_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(168);

            Node_168::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_160._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_168.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_168_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_175_isNodeDirty |= g_transaction.node_168_isOutputDirty_OUT;
        }

    }
    { // xod__core__cast_to_number__boolean #169
        if (g_transaction.node_169_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(169);

            Node_169::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_161._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_169.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_176_isNodeDirty = true;
            g_transaction.node_177_isNodeDirty = true;
        }

    }
    { // xod__core__any #170

        if (g_transaction.node_170_hasUpstreamError) {
            g_transaction.node_178_hasUpstreamError = true;
        } else if (g_transaction.node_170_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(170);

            Node_170::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_162_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_89_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_170.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_170_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_178_isNodeDirty |= g_transaction.node_170_isOutputDirty_OUT;
        }

    }
    { // xod__core__if_error__string #171
        if (g_transaction.node_171_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(171);

            Node_171::ContextObject ctxObj;

            ctxObj._error_input_IN = 0;
            ctxObj._error_input_DEF = 0;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_163._output_R;
            ctxObj._input_DEF = node_49_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            Node_171::NodeErrors previousErrors = node_171.errors;

            node_171.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_171_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            if (previousErrors.flags != node_171.errors.flags) {
                detail::printErrorToDebugSerial(171, node_171.errors.flags);

                // if an error was just raised or cleared from an output,
                // mark nearest downstream error catchers as dirty
                if (node_171.errors.output_OUT != previousErrors.output_OUT) {
                }

                // if a pulse output was cleared from error, mark downstream nodes as dirty
                // (no matter if a pulse was emitted or not)
            }

            // mark downstream nodes dirty
            g_transaction.node_179_isNodeDirty |= g_transaction.node_171_isOutputDirty_OUT;
            g_transaction.node_196_isNodeDirty |= g_transaction.node_171_isOutputDirty_OUT;
        }

        // propagate errors hold by the node outputs
        if (node_171.errors.flags) {
            if (node_171.errors.output_OUT) {
                g_transaction.node_179_hasUpstreamError = true;
                g_transaction.node_196_hasUpstreamError = true;
            }
        }
    }
    { // xod__core__any #172

        if (g_transaction.node_172_hasUpstreamError) {
            g_transaction.node_180_hasUpstreamError = true;
        } else if (g_transaction.node_172_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(172);

            Node_172::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_127_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_164_isOutputDirty_T;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_172.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_172_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_180_isNodeDirty |= g_transaction.node_172_isOutputDirty_OUT;
        }

    }
    { // xod__core__flip_flop #173

        if (g_transaction.node_173_hasUpstreamError) {
            g_transaction.node_185_hasUpstreamError = true;
        } else if (g_transaction.node_173_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(173);

            Node_173::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_SET = false;
            ctxObj._isInputDirty_TGL = g_transaction.node_164_isOutputDirty_F;
            ctxObj._isInputDirty_RST = g_transaction.node_127_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_MEM = false;

            node_173.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_173_isOutputDirty_MEM = ctxObj._isOutputDirty_MEM;

            // mark downstream nodes dirty
            g_transaction.node_185_isNodeDirty |= g_transaction.node_173_isOutputDirty_MEM;
        }

    }
    { // ____play_note #174
        if (g_transaction.node_174_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(174);

            Node_174::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_FREQ = node_20_output_VAL;
            ctxObj._input_DUR = node_98._output_OUT;

            ctxObj._isInputDirty_UPD = g_transaction.node_165_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_174.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
        }

    }
    { // xod__core__any #175
        if (g_transaction.node_175_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(175);

            Node_175::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_168_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_80_isOutputDirty_BOOT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_175.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_175_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_181_isNodeDirty |= g_transaction.node_175_isOutputDirty_OUT;
        }

    }
    { // xod__math__cube #176
        if (g_transaction.node_176_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(176);

            Node_176::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_169._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_176.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
        }

    }
    { // xod__core__pulse_on_change__number #177
        if (g_transaction.node_177_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(177);

            Node_177::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_169._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_177.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_177_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_182_isNodeDirty |= g_transaction.node_177_isOutputDirty_OUT;
        }

    }
    { // xod__core__gate__pulse #178

        if (g_transaction.node_178_hasUpstreamError) {
            g_transaction.node_183_hasUpstreamError = true;
        } else if (g_transaction.node_178_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(178);

            Node_178::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_EN = node_36_output_VAL;

            ctxObj._isInputDirty_IN = g_transaction.node_170_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_178.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_178_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_183_isNodeDirty |= g_transaction.node_178_isOutputDirty_OUT;
        }

    }
    { // xod__core__pulse_on_change__string #179

        if (g_transaction.node_179_hasUpstreamError) {
            g_transaction.node_184_hasUpstreamError = true;
        } else if (g_transaction.node_179_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(179);

            Node_179::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_171._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_179.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_179_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_184_isNodeDirty |= g_transaction.node_179_isOutputDirty_OUT;
        }

    }
    { // xod__core__buffer__number #180

        if (g_transaction.node_180_hasUpstreamError) {
            g_transaction.node_185_hasUpstreamError = true;
            g_transaction.node_204_hasUpstreamError = true;
        } else if (g_transaction.node_180_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(180);

            Node_180::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_NEW = node_155._output_R;

            ctxObj._isInputDirty_UPD = g_transaction.node_172_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_MEM = false;

            node_180.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_180_isOutputDirty_MEM = ctxObj._isOutputDirty_MEM;

            // mark downstream nodes dirty
            g_transaction.node_185_isNodeDirty |= g_transaction.node_180_isOutputDirty_MEM;
            g_transaction.node_204_isNodeDirty |= g_transaction.node_180_isOutputDirty_MEM;
        }

    }
    { // xod__core__any #181
        if (g_transaction.node_181_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(181);

            Node_181::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_175_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_87_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_181.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_181_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_186_isNodeDirty |= g_transaction.node_181_isOutputDirty_OUT;
        }

    }
    { // xod__core__any #182
        if (g_transaction.node_182_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(182);

            Node_182::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_177_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_80_isOutputDirty_BOOT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_182.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_182_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_187_isNodeDirty |= g_transaction.node_182_isOutputDirty_OUT;
        }

    }
    { // xod_dev__text_lcd__print_at__text_lcd_i2c_device #183

        if (g_transaction.node_183_hasUpstreamError) {
            g_transaction.node_196_hasUpstreamError = true;
            g_transaction.node_188_hasUpstreamError = true;
        } else if (g_transaction.node_183_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(183);

            Node_183::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_DEV = node_123._output_DEVU0027;
            ctxObj._input_ROW = node_38_output_VAL;
            ctxObj._input_POS = node_39_output_VAL;
            ctxObj._input_LEN = node_40_output_VAL;
            ctxObj._input_VAL = node_145._output_OUT;

            ctxObj._isInputDirty_DO = g_transaction.node_178_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_DEVU0027 = false;
            ctxObj._isOutputDirty_DONE = false;

            Node_183::NodeErrors previousErrors = node_183.errors;

            node_183.errors.output_DONE = false;

            if (isSettingUp()) {
                node_183.emitValue<Node_183::output_DEVU0027>(&ctxObj, node_183.getValue<Node_183::input_DEV>(&ctxObj));
            }
            node_183.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_183_isOutputDirty_DEVU0027 = ctxObj._isOutputDirty_DEVU0027;
            g_transaction.node_183_isOutputDirty_DONE = ctxObj._isOutputDirty_DONE;

            if (previousErrors.flags != node_183.errors.flags) {
                detail::printErrorToDebugSerial(183, node_183.errors.flags);

                // if an error was just raised or cleared from an output,
                // mark nearest downstream error catchers as dirty
                if (node_183.errors.output_DEVU0027 != previousErrors.output_DEVU0027) {
                }
                if (node_183.errors.output_DONE != previousErrors.output_DONE) {
                }

                // if a pulse output was cleared from error, mark downstream nodes as dirty
                // (no matter if a pulse was emitted or not)
                if (previousErrors.output_DONE && !node_183.errors.output_DONE) {
                    g_transaction.node_188_isNodeDirty = true;
                }
            }

            // mark downstream nodes dirty
            g_transaction.node_196_isNodeDirty |= g_transaction.node_183_isOutputDirty_DEVU0027;
            g_transaction.node_188_isNodeDirty |= g_transaction.node_183_isOutputDirty_DONE;
        }

        // propagate errors hold by the node outputs
        if (node_183.errors.flags) {
            if (node_183.errors.output_DEVU0027) {
                g_transaction.node_196_hasUpstreamError = true;
            }
            if (node_183.errors.output_DONE) {
                g_transaction.node_188_hasUpstreamError = true;
            }
        }
    }
    { // xod__core__any #184

        if (g_transaction.node_184_hasUpstreamError) {
            g_transaction.node_189_hasUpstreamError = true;
        } else if (g_transaction.node_184_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(184);

            Node_184::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_179_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_80_isOutputDirty_BOOT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_184.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_184_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_189_isNodeDirty |= g_transaction.node_184_isOutputDirty_OUT;
        }

    }
    { // xod__core__if_else__number #185

        if (g_transaction.node_185_hasUpstreamError) {
            g_transaction.node_190_hasUpstreamError = true;
        } else if (g_transaction.node_185_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(185);

            Node_185::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_COND = node_173._output_MEM;
            ctxObj._input_T = node_180._output_MEM;
            ctxObj._input_F = node_148._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_185.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_190_isNodeDirty = true;
        }

    }
    { // xod__core__gate__pulse #186
        if (g_transaction.node_186_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(186);

            Node_186::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_EN = node_27_output_VAL;

            ctxObj._isInputDirty_IN = g_transaction.node_181_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_186.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_186_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_191_isNodeDirty |= g_transaction.node_186_isOutputDirty_OUT;
        }

    }
    { // xod__core__any #187
        if (g_transaction.node_187_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(187);

            Node_187::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_182_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_86_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_187.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_187_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_192_isNodeDirty |= g_transaction.node_187_isOutputDirty_OUT;
        }

    }
    { // xod__core__any #188

        if (g_transaction.node_188_hasUpstreamError) {
            g_transaction.node_198_hasUpstreamError = true;
        } else if (g_transaction.node_188_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(188);

            Node_188::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_123_isOutputDirty_DONE;
            ctxObj._isInputDirty_IN2 = g_transaction.node_183_isOutputDirty_DONE;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_188.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_188_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_198_isNodeDirty |= g_transaction.node_188_isOutputDirty_OUT;
        }

    }
    { // xod__core__any #189

        if (g_transaction.node_189_hasUpstreamError) {
            g_transaction.node_193_hasUpstreamError = true;
        } else if (g_transaction.node_189_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(189);

            Node_189::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_184_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_90_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_189.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_189_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_193_isNodeDirty |= g_transaction.node_189_isOutputDirty_OUT;
        }

    }
    { // xod__math__map #190

        if (g_transaction.node_190_hasUpstreamError) {
            g_transaction.node_194_hasUpstreamError = true;
            g_transaction.node_201_hasUpstreamError = true;
        } else if (g_transaction.node_190_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(190);

            Node_190::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_X = node_185._output_R;
            ctxObj._input_Smin = node_62_output_VAL;
            ctxObj._input_Smax = node_63_output_VAL;
            ctxObj._input_Tmin = node_64_output_VAL;
            ctxObj._input_Tmax = node_65_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_190.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_194_isNodeDirty = true;
        }

    }
    { // xod__gpio__pwm_write #191
        if (g_transaction.node_191_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(191);

            Node_191::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_DUTY = node_167._output_OUT;

            ctxObj._isInputDirty_UPD = g_transaction.node_186_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_DONE = false;

            node_191.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
        }

    }
    { // xod__core__gate__pulse #192
        if (g_transaction.node_192_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(192);

            Node_192::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_EN = node_25_output_VAL;

            ctxObj._isInputDirty_IN = g_transaction.node_187_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_192.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_192_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_195_isNodeDirty |= g_transaction.node_192_isOutputDirty_OUT;
        }

    }
    { // xod__core__gate__pulse #193

        if (g_transaction.node_193_hasUpstreamError) {
            g_transaction.node_196_hasUpstreamError = true;
        } else if (g_transaction.node_193_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(193);

            Node_193::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_EN = node_44_output_VAL;

            ctxObj._isInputDirty_IN = g_transaction.node_189_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_193.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_193_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_196_isNodeDirty |= g_transaction.node_193_isOutputDirty_OUT;
        }

    }
    { // xod__core__pulse_on_change__number #194

        if (g_transaction.node_194_hasUpstreamError) {
            g_transaction.node_197_hasUpstreamError = true;
        } else if (g_transaction.node_194_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(194);

            Node_194::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_190._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_194.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_194_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_197_isNodeDirty |= g_transaction.node_194_isOutputDirty_OUT;
        }

    }
    { // xod__gpio__pwm_write #195
        if (g_transaction.node_195_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(195);

            Node_195::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_DUTY = node_176._output_OUT;

            ctxObj._isInputDirty_UPD = g_transaction.node_192_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_DONE = false;

            node_195.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
        }

    }
    { // xod_dev__text_lcd__print_at__text_lcd_i2c_device #196

        if (g_transaction.node_196_hasUpstreamError) {
            g_transaction.node_198_hasUpstreamError = true;
        } else if (g_transaction.node_196_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(196);

            Node_196::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_DEV = node_183._output_DEVU0027;
            ctxObj._input_ROW = node_45_output_VAL;
            ctxObj._input_POS = node_46_output_VAL;
            ctxObj._input_LEN = node_47_output_VAL;
            ctxObj._input_VAL = node_171._output_OUT;

            ctxObj._isInputDirty_DO = g_transaction.node_193_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_DEVU0027 = false;
            ctxObj._isOutputDirty_DONE = false;

            Node_196::NodeErrors previousErrors = node_196.errors;

            node_196.errors.output_DONE = false;

            if (isSettingUp()) {
                node_196.emitValue<Node_196::output_DEVU0027>(&ctxObj, node_196.getValue<Node_196::input_DEV>(&ctxObj));
            }
            node_196.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_196_isOutputDirty_DONE = ctxObj._isOutputDirty_DONE;

            if (previousErrors.flags != node_196.errors.flags) {
                detail::printErrorToDebugSerial(196, node_196.errors.flags);

                // if an error was just raised or cleared from an output,
                // mark nearest downstream error catchers as dirty
                if (node_196.errors.output_DEVU0027 != previousErrors.output_DEVU0027) {
                }
                if (node_196.errors.output_DONE != previousErrors.output_DONE) {
                }

                // if a pulse output was cleared from error, mark downstream nodes as dirty
                // (no matter if a pulse was emitted or not)
                if (previousErrors.output_DONE && !node_196.errors.output_DONE) {
                    g_transaction.node_198_isNodeDirty = true;
                }
            }

            // mark downstream nodes dirty
            g_transaction.node_198_isNodeDirty |= g_transaction.node_196_isOutputDirty_DONE;
        }

        // propagate errors hold by the node outputs
        if (node_196.errors.flags) {
            if (node_196.errors.output_DEVU0027) {
            }
            if (node_196.errors.output_DONE) {
                g_transaction.node_198_hasUpstreamError = true;
            }
        }
    }
    { // xod__core__any #197

        if (g_transaction.node_197_hasUpstreamError) {
            g_transaction.node_199_hasUpstreamError = true;
        } else if (g_transaction.node_197_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(197);

            Node_197::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_194_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_80_isOutputDirty_BOOT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_197.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_197_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_199_isNodeDirty |= g_transaction.node_197_isOutputDirty_OUT;
        }

    }
    { // xod__core__any #198

        if (g_transaction.node_198_hasUpstreamError) {
        } else if (g_transaction.node_198_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(198);

            Node_198::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_188_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_196_isOutputDirty_DONE;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_198.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
        }

    }
    { // xod__core__any #199

        if (g_transaction.node_199_hasUpstreamError) {
            g_transaction.node_200_hasUpstreamError = true;
        } else if (g_transaction.node_199_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(199);

            Node_199::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_197_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_92_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_199.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_199_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_200_isNodeDirty |= g_transaction.node_199_isOutputDirty_OUT;
        }

    }
    { // xod__core__gate__pulse #200

        if (g_transaction.node_200_hasUpstreamError) {
            g_transaction.node_201_hasUpstreamError = true;
        } else if (g_transaction.node_200_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(200);

            Node_200::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_EN = node_71_output_VAL;

            ctxObj._isInputDirty_IN = g_transaction.node_199_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_200.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_200_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_201_isNodeDirty |= g_transaction.node_200_isOutputDirty_OUT;
        }

    }
    { // xod_dev__servo__rotate #201

        if (g_transaction.node_201_hasUpstreamError) {
        } else if (g_transaction.node_201_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(201);

            Node_201::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_DEV = node_85._output_DEV;
            ctxObj._input_VAL = node_190._output_OUT;

            ctxObj._isInputDirty_DO = g_transaction.node_200_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_DEVU0027 = false;
            ctxObj._isOutputDirty_ACK = false;

            if (isSettingUp()) {
                node_201.emitValue<Node_201::output_DEVU0027>(&ctxObj, node_201.getValue<Node_201::input_DEV>(&ctxObj));
            }
            node_201.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
        }

    }
    { // xod__core__defer__number #202

        if (g_transaction.node_202_isNodeDirty) {
            bool error_input_IN = false;
            error_input_IN |= node_203.errors.output_OUT;
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(202);

            Node_202::ContextObject ctxObj;

            ctxObj._error_input_IN = error_input_IN;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_157._output_MEM;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            Node_202::NodeErrors previousErrors = node_202.errors;

            node_202.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_202_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            if (previousErrors.flags != node_202.errors.flags) {
                detail::printErrorToDebugSerial(202, node_202.errors.flags);

                // if an error was just raised or cleared from an output,
                // mark nearest downstream error catchers as dirty
                if (node_202.errors.output_OUT != previousErrors.output_OUT) {
                    g_transaction.node_202_isNodeDirty = true;
                    g_transaction.node_204_isNodeDirty = true;
                }

                // if a pulse output was cleared from error, mark downstream nodes as dirty
                // (no matter if a pulse was emitted or not)
            }

            // mark downstream nodes dirty
            g_transaction.node_107_isNodeDirty |= g_transaction.node_202_isOutputDirty_OUT;
            g_transaction.node_116_isNodeDirty |= g_transaction.node_202_isOutputDirty_OUT;
        }

        // propagate errors hold by the node outputs
        if (node_202.errors.flags) {
            if (node_202.errors.output_OUT) {
                g_transaction.node_107_hasUpstreamError = true;
                g_transaction.node_116_hasUpstreamError = true;
            }
        }
    }
    { // xod__core__defer__pulse #203
        if (g_transaction.node_203_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(203);

            Node_203::ContextObject ctxObj;

            ctxObj._error_input_IN = 0;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN = g_transaction.node_164_isOutputDirty_F;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            Node_203::NodeErrors previousErrors = node_203.errors;

            node_203.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_203_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            if (previousErrors.flags != node_203.errors.flags) {
                detail::printErrorToDebugSerial(203, node_203.errors.flags);

                // if an error was just raised or cleared from an output,
                // mark nearest downstream error catchers as dirty
                if (node_203.errors.output_OUT != previousErrors.output_OUT) {
                    g_transaction.node_202_isNodeDirty = true;
                    g_transaction.node_204_isNodeDirty = true;
                    g_transaction.node_203_isNodeDirty = true;
                }

                // if a pulse output was cleared from error, mark downstream nodes as dirty
                // (no matter if a pulse was emitted or not)
                if (previousErrors.output_OUT && !node_203.errors.output_OUT) {
                    g_transaction.node_132_isNodeDirty = true;
                }
            }

            // mark downstream nodes dirty
            g_transaction.node_132_isNodeDirty |= g_transaction.node_203_isOutputDirty_OUT;
        }

        // propagate errors hold by the node outputs
        if (node_203.errors.flags) {
            if (node_203.errors.output_OUT) {
                g_transaction.node_132_hasUpstreamError = true;
            }
        }
    }
    { // xod__core__defer__number #204

        if (g_transaction.node_204_isNodeDirty) {
            bool error_input_IN = false;
            error_input_IN |= node_203.errors.output_OUT;
            error_input_IN |= node_202.errors.output_OUT;
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(204);

            Node_204::ContextObject ctxObj;

            ctxObj._error_input_IN = error_input_IN;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_180._output_MEM;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            Node_204::NodeErrors previousErrors = node_204.errors;

            node_204.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_204_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            if (previousErrors.flags != node_204.errors.flags) {
                detail::printErrorToDebugSerial(204, node_204.errors.flags);

                // if an error was just raised or cleared from an output,
                // mark nearest downstream error catchers as dirty
                if (node_204.errors.output_OUT != previousErrors.output_OUT) {
                    g_transaction.node_204_isNodeDirty = true;
                }

                // if a pulse output was cleared from error, mark downstream nodes as dirty
                // (no matter if a pulse was emitted or not)
            }

            // mark downstream nodes dirty
            g_transaction.node_155_isNodeDirty |= g_transaction.node_204_isOutputDirty_OUT;
        }

        // propagate errors hold by the node outputs
        if (node_204.errors.flags) {
            if (node_204.errors.output_OUT) {
                g_transaction.node_155_hasUpstreamError = true;
            }
        }
    }

    // Clear dirtieness and timeouts for all nodes and pins
    memset(&g_transaction, 0, sizeof(g_transaction));

    detail::clearStaleTimeout(&node_109);
    detail::clearStaleTimeout(&node_113);
    detail::clearStaleTimeout(&node_137);
    detail::clearStaleTimeout(&node_139);
    detail::clearStaleTimeout(&node_142);
    detail::clearStaleTimeout(&node_150);

    XOD_TRACE_F("Transaction completed, t=");
    XOD_TRACE_LN(millis());
}

} // namespace xod
