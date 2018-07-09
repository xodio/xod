
/*=============================================================================
 *
 *
 * Main loop components
 *
 *
 =============================================================================*/

namespace xod {

// Define/allocate persistent storages (state, timeout, output data) for all nodes
{{#each nodes}}
{{~ mergePins }}
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wmissing-field-initializers"
{{#each outputs }}
{{ decltype type value }} node_{{ ../id }}_output_{{ pinKey }} = {{ cppValue type value }};
{{/each}}
#pragma GCC diagnostic pop
{{#unless patch.isConstant}}
{{ ns patch }}::Node node_{{ id }} = {
    {{ ns patch }}::State(), // state default
  {{#if patch.usesTimeouts}}
    0, // timeoutAt
  {{/if}}
  {{#each outputs}}
    node_{{ ../id }}_output_{{ pinKey }}, // output {{ pinKey }} default
  {{/each}}
  {{#eachDirtyablePin outputs}}
    {{ isDirtyOnBoot }}, // {{ pinKey }} dirty
  {{/eachDirtyablePin}}
    true // node itself dirty
};
{{/unless}}
{{/each}}

void runTransaction() {
    g_transactionTime = millis();

    XOD_TRACE_F("Transaction started, t=");
    XOD_TRACE_LN(g_transactionTime);

    // Check for timeouts
  {{#eachNodeUsingTimeouts nodes}}
    detail::checkTriggerTimeout(&node_{{ id }});
  {{/eachNodeUsingTimeouts}}

    // defer-* nodes are always at the very bottom of the graph, so no one will
    // recieve values emitted by them. We must evaluate them before everybody
    // else to give them a chance to emit values.
    //
    // If trigerred, keep only output dirty, not the node itself, so it will
    // evaluate on the regular pass only if it pushed a new value again.
  {{#eachDeferNode nodes}}
    {
        if (node_{{ id }}.isNodeDirty) {
            XOD_TRACE_F("Trigger defer node #");
            XOD_TRACE_LN({{ id }});

            {{ns patch }}::ContextObject ctxObj;
            ctxObj._node = &node_{{ id }};
            ctxObj._isInputDirty_IN = false;

            {{ ns patch }}::evaluate(&ctxObj);

            // mark downstream nodes dirty
          {{#each outputs }}
            {{#if isDirtyable ~}}
            {{#each to}}
            node_{{ this }}.isNodeDirty |= node_{{ ../../id }}.isOutputDirty_{{ ../pinKey }};
            {{/each}}
            {{else}}
            {{#each to}}
            node_{{ this }}.isNodeDirty = true;
            {{/each}}
            {{/if}}
          {{/each}}

            node_{{ id }}.isNodeDirty = false;
            detail::clearTimeout(&node_{{ id }});
        }
    }
  {{/eachDeferNode}}

    // Evaluate all dirty nodes
  {{#eachNonConstantNode nodes}}
    { // {{ ns patch }} #{{ id }}
        if (node_{{ id }}.isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN({{ id }});

            {{ns patch }}::ContextObject ctxObj;
            ctxObj._node = &node_{{ id }};
          {{#if patch.usesNodeId}}
            ctxObj._nodeId = {{ id }};
          {{/if}}

            // copy data from upstream nodes into context
          {{#eachLinkedInput inputs}}
            {{!--
              // We refer to node_42.output_FOO as data source in case
              // of a regular node and directly use node_42_output_VAL
              // initial value constexpr in case of a constant. It’s
              // because store no Node structures at the global level
            --}}
            ctxObj._input_{{ pinKey }} = node_{{ fromNodeId }}
                {{~#if fromPatch.isConstant }}_{{else}}.{{/if~}}
                output_{{ fromPinKey }};
          {{/eachLinkedInput}}

          {{#eachNonlinkedInput inputs}}
            {{!--
              // Nonlinked pulse inputs are never dirty, all value types
              // are linked (to extracted constant nodes) and so will be
              // processed in another loop.
            --}}
            {{#if isDirtyable}}
            ctxObj._isInputDirty_{{ pinKey }} = false;
            {{/if}}
          {{/eachNonlinkedInput}}
          {{#eachLinkedInput inputs}}
            {{!--
              // Constants do not store dirtieness. They are never dirty
              // except the very first run
            --}}
            {{#if isDirtyable}}
            {{#if fromPatch.isConstant}}
            ctxObj._isInputDirty_{{ pinKey }} = g_isSettingUp;
            {{else if fromOutput.isDirtyable}}
            ctxObj._isInputDirty_{{ pinKey }} = node_{{ fromNodeId }}.isOutputDirty_{{ fromPinKey }};
            {{else}}
            ctxObj._isInputDirty_{{ pinKey }} = true;
            {{/if}}
            {{/if}}
          {{/eachLinkedInput}}

            {{ ns patch }}::evaluate(&ctxObj);

            // mark downstream nodes dirty
          {{#each outputs }}
            {{#if isDirtyable ~}}
            {{#each to}}
            node_{{ this }}.isNodeDirty |= node_{{ ../../id }}.isOutputDirty_{{ ../pinKey }};
            {{/each}}
            {{else}}
            {{#each to}}
            node_{{ this }}.isNodeDirty = true;
            {{/each}}
            {{/if}}
          {{/each}}
        }
    }
  {{/eachNonConstantNode}}

    // Clear dirtieness and timeouts for all nodes and pins
  {{#eachNonConstantNode nodes}}
    node_{{ id }}.dirtyFlags = 0;
  {{/eachNonConstantNode}}
  {{#eachNodeUsingTimeouts nodes}}
    detail::clearStaleTimeout(&node_{{ id }});
  {{/eachNodeUsingTimeouts}}

    XOD_TRACE_F("Transaction completed, t=");
    XOD_TRACE_LN(millis());
}

} // namespace xod
