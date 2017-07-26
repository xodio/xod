{{!-- Template for program graph --}}
{{!-- Accepts the context with list of Nodes --}}
/*=============================================================================
 *
 *
 * Program graph
 *
 *
 =============================================================================*/

namespace _program {
  {{#each nodes}}
  {{mergePins }}
  {{#each outputs }}
    NodeId links_{{ ../id }}_{{ pinKey }}[] = { {{#each to }}{{ this }}, {{/each}}NO_NODE };
    {{/each}}
    {{ patch/owner }}__{{ patch/libName }}__{{ patch/patchName }}::Storage storage_{{ id }} = {
        { }, // state
      {{#each inputs }}
        {{#exists nodeId }}
        { NodeId({{ nodeId }}), {{ patch/owner }}__{{ patch/libName }}__{{ patch/patchName }}::output_{{ fromPinKey  }}::KEY }, // input_{{ pinKey }}
        {{else }}
        { NO_NODE, 0 }, // input_{{ pinKey }}
        {{/exists }}
      {{/each}}
      {{#each outputs }}
        { {{ value }}, links_{{ ../id }}_{{ pinKey }} }{{#unless @last }},{{/unless }} // output_{{ pinKey }}
      {{/each}}
    };
  {{/each}}

    void* storages[NODE_COUNT] = {
      {{#each nodes}}
        &storage_{{ id }}{{#unless @last }},{{/unless }}
      {{/each}}
    };

    EvalFuncPtr evaluationFuncs[NODE_COUNT] = {
      {{#each nodes}}
        (EvalFuncPtr)&{{ patch/owner }}__{{ patch/libName }}__{{ patch/patchName }}::evaluate{{#unless @last }},{{/unless }}
      {{/each}}
    };

    DirtyFlags dirtyFlags[NODE_COUNT] = {
        {{#each nodes}}DirtyFlags(-1){{#unless @last}},
        {{/unless}}{{/each}}
    };

    NodeId topology[NODE_COUNT] = {
        {{#each topology}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
    };

    TimeMs schedule[NODE_COUNT] = { 0 };
}
