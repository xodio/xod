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
