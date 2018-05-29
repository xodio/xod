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
// {{ patchPath }} implementation
//-----------------------------------------------------------------------------
namespace {{ns this }} {

{{ implementation }}

} // namespace {{ns this }}

{{/unless}}
{{/each}}
} // namespace xod
