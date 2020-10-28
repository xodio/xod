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
// xod-dev/dht/dht11-device implementation
//-----------------------------------------------------------------------------
namespace xod {
namespace xod_dev__dht__dht11_device {
template <uint8_t constant_input_PORT>
struct Node {

    typedef uint8_t typeof_PORT;

  struct Type {
     static constexpr typeof_PORT port = constant_input_PORT;
  };

    typedef Type typeof_DEV;

    struct input_PORT { };
    struct output_DEV { };

    static const identity<typeof_PORT> getValueType(input_PORT) {
      return identity<typeof_PORT>();
    }
    static const identity<typeof_DEV> getValueType(output_DEV) {
      return identity<typeof_DEV>();
    }

    typeof_DEV _output_DEV;

    Node (typeof_DEV output_DEV) {
        _output_DEV = output_DEV;
    }

    struct ContextObject {

        bool _isOutputDirty_DEV : 1;
    };

    using Context = ContextObject*;

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_PORT" \
                " output_DEV");
    }

    typeof_PORT getValue(Context ctx, identity<input_PORT>) {
        return constant_input_PORT;
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
    }

    void evaluate(Context ctx) {
        static_assert(isValidDigitalPort(constant_input_PORT), "must be a valid digital port");

        // just to trigger downstream nodes
        emitValue<output_DEV>(ctx, {});
    }

};
} // namespace xod_dev__dht__dht11_device
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
// xod-dev/dht/unpack-dht11-device implementation
//-----------------------------------------------------------------------------
namespace xod {
namespace xod_dev__dht__unpack_dht11_device {
template <typename typeof_DEV>
struct Node {

    typedef uint8_t typeof_OUT;

    struct input_DEV { };
    struct output_OUT { };

    static const identity<typeof_DEV> getValueType(input_DEV) {
      return identity<typeof_DEV>();
    }
    static const identity<typeof_OUT> getValueType(output_OUT) {
      return identity<typeof_OUT>();
    }

    Node () {
    }

    struct ContextObject {

        typeof_DEV _input_DEV;

        bool _isOutputDirty_OUT : 1;
    };

    using Context = ContextObject*;

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_DEV" \
                " output_OUT");
    }

    typeof_DEV getValue(Context ctx, identity<input_DEV>) {
        return ctx->_input_DEV;
    }
    typeof_OUT getValue(Context ctx, identity<output_OUT>) {
        return constant_output_OUT;
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

    void emitValue(Context ctx, typeof_OUT val, identity<output_OUT>) __attribute__((deprecated("No need to emitValue from constant outputs."))) {
    }

    static constexpr uint8_t constant_output_OUT = typeof_DEV::port;

    void evaluate(Context ctx) {
        // We don't need to worry about emitting from constant outputs.
        // Outputs will be always dirty on boot, and then the value will never change anyway.
    }

};
} // namespace xod_dev__dht__unpack_dht11_device
} // namespace xod

//-----------------------------------------------------------------------------
// xod-dev/dht/dhtxx-read-raw implementation
//-----------------------------------------------------------------------------
namespace xod {
namespace xod_dev__dht__dhtxx_read_raw {
template <uint8_t constant_input_PORT>
struct Node {

    typedef uint8_t typeof_PORT;
    typedef Pulse typeof_DO;

    typedef Number typeof_D0;
    typedef Number typeof_D1;
    typedef Number typeof_D2;
    typedef Number typeof_D3;
    typedef Pulse typeof_DONE;

    struct input_PORT { };
    struct input_DO { };
    struct output_D0 { };
    struct output_D1 { };
    struct output_D2 { };
    struct output_D3 { };
    struct output_DONE { };

    static const identity<typeof_PORT> getValueType(input_PORT) {
      return identity<typeof_PORT>();
    }
    static const identity<typeof_DO> getValueType(input_DO) {
      return identity<typeof_DO>();
    }
    static const identity<typeof_D0> getValueType(output_D0) {
      return identity<typeof_D0>();
    }
    static const identity<typeof_D1> getValueType(output_D1) {
      return identity<typeof_D1>();
    }
    static const identity<typeof_D2> getValueType(output_D2) {
      return identity<typeof_D2>();
    }
    static const identity<typeof_D3> getValueType(output_D3) {
      return identity<typeof_D3>();
    }
    static const identity<typeof_DONE> getValueType(output_DONE) {
      return identity<typeof_DONE>();
    }

    union NodeErrors {
        struct {
            bool output_D0 : 1;
            bool output_D1 : 1;
            bool output_D2 : 1;
            bool output_D3 : 1;
            bool output_DONE : 1;
        };

        ErrorFlags flags = 0;
    };

    NodeErrors errors = {};
    TimeMs timeoutAt = 0;

    typeof_D0 _output_D0;
    typeof_D1 _output_D1;
    typeof_D2 _output_D2;
    typeof_D3 _output_D3;

    Node (typeof_D0 output_D0, typeof_D1 output_D1, typeof_D2 output_D2, typeof_D3 output_D3) {
        _output_D0 = output_D0;
        _output_D1 = output_D1;
        _output_D2 = output_D2;
        _output_D3 = output_D3;
    }

    struct ContextObject {

        bool _isInputDirty_DO;

        bool _isOutputDirty_D0 : 1;
        bool _isOutputDirty_D1 : 1;
        bool _isOutputDirty_D2 : 1;
        bool _isOutputDirty_D3 : 1;
        bool _isOutputDirty_DONE : 1;
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
                " input_PORT input_DO" \
                " output_D0 output_D1 output_D2 output_D3 output_DONE");
    }

    typeof_PORT getValue(Context ctx, identity<input_PORT>) {
        return constant_input_PORT;
    }
    typeof_DO getValue(Context ctx, identity<input_DO>) {
        return Pulse();
    }
    typeof_D0 getValue(Context ctx, identity<output_D0>) {
        return this->_output_D0;
    }
    typeof_D1 getValue(Context ctx, identity<output_D1>) {
        return this->_output_D1;
    }
    typeof_D2 getValue(Context ctx, identity<output_D2>) {
        return this->_output_D2;
    }
    typeof_D3 getValue(Context ctx, identity<output_D3>) {
        return this->_output_D3;
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
                " output_D0 output_D1 output_D2 output_D3 output_DONE");
    }

    void emitValue(Context ctx, typeof_D0 val, identity<output_D0>) {
        this->_output_D0 = val;
        ctx->_isOutputDirty_D0 = true;
        this->errors.output_D0 = false;
    }
    void emitValue(Context ctx, typeof_D1 val, identity<output_D1>) {
        this->_output_D1 = val;
        ctx->_isOutputDirty_D1 = true;
        this->errors.output_D1 = false;
    }
    void emitValue(Context ctx, typeof_D2 val, identity<output_D2>) {
        this->_output_D2 = val;
        ctx->_isOutputDirty_D2 = true;
        this->errors.output_D2 = false;
    }
    void emitValue(Context ctx, typeof_D3 val, identity<output_D3>) {
        this->_output_D3 = val;
        ctx->_isOutputDirty_D3 = true;
        this->errors.output_D3 = false;
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
                " output_D0 output_D1 output_D2 output_D3 output_DONE");
    }

    void raiseError(Context ctx, identity<output_D0>) {
        this->errors.output_D0 = true;
        ctx->_isOutputDirty_D0 = true;
    }
    void raiseError(Context ctx, identity<output_D1>) {
        this->errors.output_D1 = true;
        ctx->_isOutputDirty_D1 = true;
    }
    void raiseError(Context ctx, identity<output_D2>) {
        this->errors.output_D2 = true;
        ctx->_isOutputDirty_D2 = true;
    }
    void raiseError(Context ctx, identity<output_D3>) {
        this->errors.output_D3 = true;
        ctx->_isOutputDirty_D3 = true;
    }
    void raiseError(Context ctx, identity<output_DONE>) {
        this->errors.output_DONE = true;
        ctx->_isOutputDirty_DONE = true;
    }

    void raiseError(Context ctx) {
        this->errors.output_D0 = true;
        ctx->_isOutputDirty_D0 = true;
        this->errors.output_D1 = true;
        ctx->_isOutputDirty_D1 = true;
        this->errors.output_D2 = true;
        ctx->_isOutputDirty_D2 = true;
        this->errors.output_D3 = true;
        ctx->_isOutputDirty_D3 = true;
        this->errors.output_DONE = true;
        ctx->_isOutputDirty_DONE = true;
    }

    bool reading;

    enum DhtStatus
    {
        DHT_OK = 0,
        DHT_START_FAILED_1 = 1,
        DHT_START_FAILED_2 = 2,
        DHT_READ_TIMEOUT = 3,
        DHT_CHECKSUM_FAILURE = 4,
    };

    unsigned long pulseInLength(uint8_t pin, bool state, unsigned long timeout) {
        unsigned long startMicros = micros();
        while (digitalRead(pin) == state) {
            if (micros() - startMicros > timeout)
                return 0;
        }
        return micros() - startMicros;
    }

    bool readByte(uint8_t port, uint8_t* out) {
        // Collect 8 bits from datastream, return them interpreted
        // as a byte. I.e. if 0000.0101 is sent, return decimal 5.

        unsigned long pulseLength = 0;
        uint8_t result = 0;
        for (uint8_t i = 8; i--; ) {
            // We enter this during the first start bit (low for 50uS) of the byte

            if (pulseInLength(port, LOW, 70) == 0)
                return false;

            // Dataline will now stay high for 27 or 70 uS, depending on
            // whether a 0 or a 1 is being sent, respectively.

            pulseLength = pulseInLength(port, HIGH, 80);

            if (pulseLength == 0)
                return false;

            if (pulseLength > 45)
                result |= 1 << i; // set subsequent bit
        }

        *out = result;
        return true;
    }

    DhtStatus readValues(uint8_t port, uint8_t* outData) {
        // Stop reading request
        digitalWrite(port, HIGH);

        // DHT datasheet says host should keep line high 20-40us, then watch for
        // sensor taking line low.  That low should last 80us. Acknowledges "start
        // read and report" command.
        delayMicroseconds(30);

        // Change Arduino pin to an input, to watch for the 80us low explained a
        // moment ago.
        pinMode(port, INPUT_PULLUP);

        if (pulseInLength(port, LOW, 90) == 0)
            return DHT_START_FAILED_1;

        // After 80us low, the line should be taken high for 80us by the sensor.
        // The low following that high is the start of the first bit of the forty
        // to come. The method readByte() expects to be called with the system
        // already into this low.
        if (pulseInLength(port, HIGH, 90) == 0)
            return DHT_START_FAILED_2;

        // now ready for data reception... pick up the 5 bytes coming from
        // the sensor
        for (uint8_t i = 0; i < 5; i++)
            if (!readByte(port, outData + i))
                return DHT_READ_TIMEOUT;

        // Restore pin to output duties
        pinMode(port, OUTPUT);
        digitalWrite(port, HIGH);

        // See if data received consistent with checksum received
        uint8_t checkSum = outData[0] + outData[1] + outData[2] + outData[3];
        if (outData[4] != checkSum)
            return DHT_CHECKSUM_FAILURE;

        return DHT_OK;
    }

    void enterIdleState(uint8_t port) {
        // Restore pin to output duties
        pinMode(port, OUTPUT);
        digitalWrite(port, HIGH);
    }

    void evaluate(Context ctx) {
        static_assert(isValidDigitalPort(constant_input_PORT), "must be a valid digital port");

        uint8_t port = constant_input_PORT;

        if (reading) {
            uint8_t data[5];
            auto status = readValues(port, data);

            if (status == DHT_OK) {
                emitValue<output_D0>(ctx, data[0]);
                emitValue<output_D1>(ctx, data[1]);
                emitValue<output_D2>(ctx, data[2]);
                emitValue<output_D3>(ctx, data[3]);
                emitValue<output_DONE>(ctx, 1);
            } else {
                raiseError(ctx);
            }

            enterIdleState(port);
            reading = false;
        } else if (isInputDirty<input_DO>(ctx)) {
            // initiate request for data
            pinMode(port, OUTPUT);
            digitalWrite(port, LOW);
            // for request we should keep the line low for 18+ ms
            setTimeout(ctx, 18);
            reading = true;
        } else {
            enterIdleState(port);
        }
    }

};
} // namespace xod_dev__dht__dhtxx_read_raw
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

// outputs of constant nodes
constexpr uint8_t node_0_output_VAL = 11;

#pragma GCC diagnostic pop

struct TransactionState {
    bool node_1_isNodeDirty : 1;
    bool node_1_isOutputDirty_TICK : 1;
    bool node_2_isNodeDirty : 1;
    bool node_2_isOutputDirty_DEV : 1;
    bool node_3_isNodeDirty : 1;
    bool node_3_isOutputDirty_OUT : 1;
    bool node_4_isNodeDirty : 1;
    TransactionState() {
        node_1_isNodeDirty = true;
        node_1_isOutputDirty_TICK = false;
        node_2_isNodeDirty = true;
        node_2_isOutputDirty_DEV = true;
        node_3_isNodeDirty = true;
        node_3_isOutputDirty_OUT = true;
        node_4_isNodeDirty = true;
    }
};

TransactionState g_transaction;

typedef xod__core__continuously::Node Node_1;
Node_1 node_1 = Node_1();

typedef xod_dev__dht__dht11_device::Node<node_0_output_VAL> Node_2;
Node_2 node_2 = Node_2({ /* xod-dev/dht/dht11-device */ });

typedef xod_dev__dht__unpack_dht11_device::Node<Node_2::typeof_DEV> Node_3;
Node_3 node_3 = Node_3();

typedef xod_dev__dht__dhtxx_read_raw::Node<Node_3::constant_output_OUT> Node_4;
Node_4 node_4 = Node_4(0, 0, 0, 0);

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
}

void runTransaction() {
    g_transactionTime = millis();

    XOD_TRACE_F("Transaction started, t=");
    XOD_TRACE_LN(g_transactionTime);

#if defined(XOD_DEBUG) || defined(XOD_SIMULATION)
    detail::handleDebugProtocolMessages();
#endif

    // Check for timeouts
    g_transaction.node_4_isNodeDirty |= detail::isTimedOut(&node_4);
    if (node_1.isSetImmediate) {
      node_1.isSetImmediate = false;
      g_transaction.node_1_isNodeDirty = true;
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
    { // xod__core__continuously #1
        if (g_transaction.node_1_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(1);

            Node_1::ContextObject ctxObj;

            // copy data from upstream nodes into context

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_TICK = false;

            node_1.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_1_isOutputDirty_TICK = ctxObj._isOutputDirty_TICK;

            // mark downstream nodes dirty
            g_transaction.node_4_isNodeDirty |= g_transaction.node_1_isOutputDirty_TICK;
        }

    }
    { // xod_dev__dht__dht11_device #2
        if (g_transaction.node_2_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(2);

            Node_2::ContextObject ctxObj;

            // copy data from upstream nodes into context

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_DEV = false;

            node_2.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_2_isOutputDirty_DEV = ctxObj._isOutputDirty_DEV;

            // mark downstream nodes dirty
            g_transaction.node_3_isNodeDirty |= g_transaction.node_2_isOutputDirty_DEV;
        }

    }
    { // xod_dev__dht__unpack_dht11_device #3
        if (g_transaction.node_3_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(3);

            Node_3::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_DEV = node_2._output_DEV;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_3.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_3_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_4_isNodeDirty |= g_transaction.node_3_isOutputDirty_OUT;
        }

    }
    { // xod_dev__dht__dhtxx_read_raw #4
        if (g_transaction.node_4_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(4);

            Node_4::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_DO = g_transaction.node_1_isOutputDirty_TICK;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_D0 = false;
            ctxObj._isOutputDirty_D1 = false;
            ctxObj._isOutputDirty_D2 = false;
            ctxObj._isOutputDirty_D3 = false;
            ctxObj._isOutputDirty_DONE = false;

            Node_4::NodeErrors previousErrors = node_4.errors;

            node_4.errors.output_DONE = false;

            node_4.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            if (previousErrors.flags != node_4.errors.flags) {
                detail::printErrorToDebugSerial(4, node_4.errors.flags);

                // if an error was just raised or cleared from an output,
                // mark nearest downstream error catchers as dirty
                if (node_4.errors.output_D0 != previousErrors.output_D0) {
                }
                if (node_4.errors.output_D1 != previousErrors.output_D1) {
                }
                if (node_4.errors.output_D2 != previousErrors.output_D2) {
                }
                if (node_4.errors.output_D3 != previousErrors.output_D3) {
                }
                if (node_4.errors.output_DONE != previousErrors.output_DONE) {
                }

                // if a pulse output was cleared from error, mark downstream nodes as dirty
                // (no matter if a pulse was emitted or not)
                if (previousErrors.output_DONE && !node_4.errors.output_DONE) {
                }
            }

            // mark downstream nodes dirty
        }

        // propagate errors hold by the node outputs
        if (node_4.errors.flags) {
            if (node_4.errors.output_D0) {
            }
            if (node_4.errors.output_D1) {
            }
            if (node_4.errors.output_D2) {
            }
            if (node_4.errors.output_D3) {
            }
            if (node_4.errors.output_DONE) {
            }
        }
    }

    // Clear dirtieness and timeouts for all nodes and pins
    memset(&g_transaction, 0, sizeof(g_transaction));

    detail::clearStaleTimeout(&node_4);

    XOD_TRACE_F("Transaction completed, t=");
    XOD_TRACE_LN(millis());
}

} // namespace xod
