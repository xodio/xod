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
  uint8_t r, g, b;
};

} // namespace xod
