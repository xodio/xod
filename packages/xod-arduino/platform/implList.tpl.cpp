{{!-- Template for program graph --}}
{{!-- Accepts the context with list of TPatch --}}
/*=============================================================================
 *
 *
 * Native node implementations
 *
 *
 =============================================================================*/

namespace xod {

{{#each this}}
{{#unless isConstant}}
//-----------------------------------------------------------------------------
// {{ owner }}/{{ libName }}/{{ patchName }} implementation
//-----------------------------------------------------------------------------
namespace {{ owner }}__{{ libName }}__{{ patchName }} {

{{ implementation }}

} // namespace {{ owner }}__{{ libName }}__{{ patchName }}

{{/unless}}
{{/each}}
} // namespace xod
