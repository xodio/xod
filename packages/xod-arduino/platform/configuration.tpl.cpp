{{!-- Template for program configuration block --}}
{{!-- Accepts the Config context --}}

/*=============================================================================
 *
 *
 * Configuration
 *
 *
 =============================================================================*/

// Uncomment to turn on debug of the program
{{#unless XOD_DEBUG}}//{{/unless}}#define XOD_DEBUG

// Uncomment to trace the program runtime in the Serial Monitor
//#define XOD_DEBUG_ENABLE_TRACE

{{#if XOD_USERNAME}}
#define XOD_USERNAME "{{XOD_USERNAME}}"
{{else if XOD_USERNAME_NEEDED}}
//#define XOD_USERNAME "your_username"
static_assert(false, "Program uses `=XOD_USERNAME` literal. Uncomment line above, put your username there, and remove this line.");
{{/if}}

// Uncomment to make possible simulation of the program
{{#unless XOD_SIMULATION}}//{{/unless}}#define XOD_SIMULATION

#ifdef XOD_SIMULATION
#include <WasmSerial.h>
#define XOD_DEBUG_SERIAL WasmSerial
#else
#define XOD_DEBUG_SERIAL DEBUG_SERIAL
#endif
