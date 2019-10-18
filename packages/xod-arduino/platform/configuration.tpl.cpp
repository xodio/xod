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

{{#each literals}}
{{#if value}}
#define {{key}} {{value}}
{{else}}
//#define {{key}} "value for {{key}}"
static_assert(false, "Program uses `={{key}}` literal. Uncomment line above, put your username there, and remove this line.");
{{/if}}
{{/each}}

// Uncomment to make possible simulation of the program
{{#unless XOD_SIMULATION}}//{{/unless}}#define XOD_SIMULATION

#ifdef XOD_SIMULATION
#include <WasmSerial.h>
#define XOD_DEBUG_SERIAL WasmSerial
#else
#define XOD_DEBUG_SERIAL DEBUG_SERIAL
#endif
