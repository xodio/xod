{{!-- Template for program graph --}}
{{!-- Accepts the context with list of Nodes --}}
/*=============================================================================
 *
 *
 * Native node implementations
 *
 *
 =============================================================================*/

namespace xod {

{{#each this}}
//-----------------------------------------------------------------------------
// {{ owner }}/{{ libName }}/{{ patchName }} implementation
//-----------------------------------------------------------------------------
namespace {{ owner }}__{{ libName }}__{{ patchName }} {

{{ implementation }}

} // namespace {{ owner }}__{{ libName }}__{{ patchName }}

{{/each}}
} // namespace xod
