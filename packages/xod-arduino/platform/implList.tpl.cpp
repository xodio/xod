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
  namespace {{ owner }} { namespace {{ libName }} { namespace {{ patchName }} {
  {{ implementation }}
  }}}
  {{/each}}
}
