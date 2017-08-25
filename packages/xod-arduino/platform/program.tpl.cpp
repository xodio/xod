{{!-- Template for program graph --}}
{{!-- Accepts the context with list of Nodes --}}
/*=============================================================================
 *
 *
 * Program graph
 *
 *
 =============================================================================*/

namespace xod {

    //-------------------------------------------------------------------------
    // Dynamic data
    //-------------------------------------------------------------------------
  {{#each nodes}}
  {{mergePins }}
    // Storage of #{{ id }} {{ patch.owner }}/{{ patch.libName }}/{{ patch.patchName }}
    {{ns patch }}::Storage storage_{{ id }} = {
        { }, // state
      {{#each outputs }}
        {{ value }}{{#unless @last }},{{/unless }} // output_{{ pinKey }}
      {{/each}}
    };
  {{/each}}

    DirtyFlags g_dirtyFlags[NODE_COUNT] = {
        {{#each nodes}}DirtyFlags({{ dirtyFlags }}){{#unless @last}},
        {{/unless}}{{/each}}
    };

    TimeMs g_schedule[NODE_COUNT] = { 0 };

    //-------------------------------------------------------------------------
    // Static (immutable) data
    //-------------------------------------------------------------------------
  {{#each nodes}}
  {{mergePins }}
    // Wiring of #{{ id }} {{ patch.owner }}/{{ patch.libName }}/{{ patch.patchName }}
  {{#each outputs }}
    const NodeId outLinks_{{ ../id }}_{{ pinKey }}[] PROGMEM = { {{#each to }}{{ this }}, {{/each}}NO_NODE };
  {{/each}}
    const {{ns patch }}::Wiring wiring_{{ id }} PROGMEM = {
        &{{ns patch }}::evaluate,
        // inputs (UpstreamPinRef’s initializers)
      {{#each inputs }}
        {{#exists nodeId }}
        { NodeId({{ nodeId }}),
            {{ns patch }}::output_{{ fromPinKey  }}::INDEX,
            {{ns patch }}::output_{{ fromPinKey  }}::STORAGE_OFFSET }, // input_{{ pinKey }}
        {{else }}
        { NO_NODE, 0, 0 }, // input_{{ pinKey }}
        {{/exists }}
      {{/each}}
        // outputs (NodeId list binding)
      {{#each outputs }}
        outLinks_{{ ../id }}_{{ pinKey }}{{#unless @last }},{{/unless }} // output_{{ pinKey }}
      {{/each}}
    };
  {{/each}}

    // PGM array with pointers to PGM wiring information structs
    const void* const g_wiring[NODE_COUNT] PROGMEM = {
      {{#each nodes}}
        &wiring_{{ id }}{{#unless @last }},{{/unless }}
      {{/each}}
    };

    // PGM array with pointers to RAM-located storages
    void* const g_storages[NODE_COUNT] PROGMEM = {
      {{#each nodes}}
        &storage_{{ id }}{{#unless @last }},{{/unless }}
      {{/each}}
    };

    NodeId g_topology[NODE_COUNT] = {
        {{#each topology}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
    };
}
