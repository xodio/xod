{{!-- Template for program graph --}}
{{!-- Accepts the context with list of Nodes --}}
/*=============================================================================
 *
 *
 * Native node implementations
 *
 *
 =============================================================================*/

namespace _program {

{{#each this}}
//-----------------------------------------------------------------------------
// {{ owner }}/{{ libName }}/{{ patchName }} implementation
//-----------------------------------------------------------------------------
namespace {{ owner }} { namespace {{ libName }} { namespace {{ patchName }} {

{{ implementation }}

}}} // namespace {{ owner }}::{{ libName }}::{{ patchName }}

{{/each}}
} // namespace _program
