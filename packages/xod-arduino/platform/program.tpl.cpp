
/*=============================================================================
 *
 *
 * Main loop components
 *
 *
 =============================================================================*/

namespace xod {

// Define/allocate persistent storages (state, timeout, output data) for all nodes
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wmissing-field-initializers"
{{#each nodes}}
{{~ mergePins }}
{{#each outputs }}
{{ decltype type value }} node_{{ ../id }}_output_{{ pinKey }} = {{ cppValue type value }};
{{/each}}
{{/each}}

#pragma GCC diagnostic pop

struct TransactionState {
{{#each nodes}}
{{#unless patch.isConstant}}
    bool node_{{id}}_isNodeDirty : 1;
  {{#each outputs}}
    bool node_{{ ../id }}_isOutputDirty_{{ pinKey }} : 1;
  {{/each}}
  {{#if (hasUpstreamErrorRaisers this)}}
    bool node_{{id}}_hasUpstreamError : 1;
  {{/if}}
{{/unless}}
{{/each}}
    TransactionState() {
    {{#each nodes}}
      {{#unless patch.isConstant}}
        node_{{id}}_isNodeDirty = true;
        {{#eachDirtyablePin outputs}}
        node_{{ ../id }}_isOutputDirty_{{ pinKey }} = {{ isDirtyOnBoot }};
        {{/eachDirtyablePin}}
      {{/unless}}
    {{/each}}
    }
};

TransactionState g_transaction;

{{#each nodes}}
{{#unless patch.isConstant}}
{{ ns patch }}::Node node_{{ id }} = {
  {{#if patch.raisesErrors}}
    {{#each outputs}}
    false, // {{ pinKey }} has no errors on start
    {{/each}}
  {{/if}}
  {{#if patch.usesTimeouts}}
    0, // timeoutAt
  {{/if}}
  {{#each outputs}}
    node_{{ ../id }}_output_{{ pinKey }}, // output {{ pinKey }} default
  {{/each}}
    {{ ns patch }}::State() // state default
};
{{/unless}}
{{/each}}

#if defined(XOD_DEBUG) || defined(XOD_SIMULATION)
namespace detail {
void handleTweaks() {
    if (XOD_DEBUG_SERIAL.available() > 0 && XOD_DEBUG_SERIAL.find("+XOD:", 5)) {
        int tweakedNodeId = XOD_DEBUG_SERIAL.parseInt();

        switch (tweakedNodeId) {
          {{#eachTweakNode nodes}}
            case {{ id }}:
                {
                {{#switchByTweakType patch.patchPath}}
                  {{#case "number"}}
                    node_{{ id }}.output_OUT = XOD_DEBUG_SERIAL.parseFloat();
                  {{/case}}
                  {{#case "byte"}}
                    node_{{ id }}.output_OUT = XOD_DEBUG_SERIAL.parseInt();
                  {{/case}}
                  {{#case "pulse"}}
                    node_{{ id }}.output_OUT = 1;
                  {{/case}}
                  {{#case "boolean"}}
                    node_{{ id }}.output_OUT = (bool)XOD_DEBUG_SERIAL.parseInt();
                  {{/case}}
                  {{#case "string"}}
                    XOD_DEBUG_SERIAL.read(); // consume the ':' separator that was left after parsing node id
                    size_t readChars = XOD_DEBUG_SERIAL.readBytesUntil('\r', node_{{ id }}.state.buff, {{getStringTweakLength patch.patchPath}});
                    node_{{ id }}.state.buff[readChars] = '\0';
                  {{/case}}
                {{/switchByTweakType}}
                    // to run evaluate and mark all downstream nodes as dirty
                    g_transaction.node_{{id}}_isNodeDirty = true;
                    node_{{ id }}.isOutputDirty_OUT = true;
                }
                break;

          {{/eachTweakNode}}
        }

        XOD_DEBUG_SERIAL.find('\n');
    }
}
} // namespace detail
#endif

void runTransaction() {
    g_transactionTime = millis();

    XOD_TRACE_F("Transaction started, t=");
    XOD_TRACE_LN(g_transactionTime);

#if defined(XOD_DEBUG) || defined(XOD_SIMULATION)
    detail::handleTweaks();
#endif

    // Check for timeouts
  {{#eachNodeUsingTimeouts nodes}}
    g_transaction.node_{{id}}_isNodeDirty |= detail::isTimedOut(&node_{{id}});
  {{/eachNodeUsingTimeouts}}

    // defer-* nodes are always at the very bottom of the graph, so no one will
    // recieve values emitted by them. We must evaluate them before everybody
    // else to give them a chance to emit values.
    //
    // If trigerred, keep only output dirty, not the node itself, so it will
    // evaluate on the regular pass only if it pushed a new value again.
  {{#eachDeferNode nodes}}
    {
        if (g_transaction.node_{{id}}_isNodeDirty) {
            // if a defer has an error, do not evaluate it, but spread the dirtyness
            if (!node_{{ id }}.errorFlags) {
                XOD_TRACE_F("Trigger defer node #");
                XOD_TRACE_LN({{ id }});

                {{ns patch }}::ContextObject ctxObj;
                ctxObj._node = &node_{{ id }};
                ctxObj._isInputDirty_IN = false;
                ctxObj._error_input_IN = 0;
              {{#eachDirtyablePin outputs}}
                ctxObj._isOutputDirty_{{ pinKey }} = false;
              {{/eachDirtyablePin}}

                {{ ns patch }}::evaluate(&ctxObj);

                // transfer dirtiness state from context to g_transaction
              {{#eachDirtyablePin outputs}}
                g_transaction.node_{{ ../id }}_isOutputDirty_{{ pinKey }} = ctxObj._isOutputDirty_{{ pinKey }};
              {{/eachDirtyablePin}}
            }

            if (node_{{ id }}.errorFlags) {
              {{#each outputs }}
                {{#each to}}
                g_transaction.node_{{ this }}_isNodeDirty = true;
                g_transaction.node_{{ this }}_hasUpstreamError = true;
                {{/each}}
              {{/each}}
            }

            // mark downstream nodes dirty
          {{#each outputs }}
            {{#if isDirtyable ~}}
            {{#each to}}
            g_transaction.node_{{ this }}_isNodeDirty |= g_transaction.node_{{ ../../id }}_isOutputDirty_{{ ../pinKey }} || node_{{ ../../id }}.errorFlags;
            {{/each}}
            {{else}}
            {{#each to}}
            g_transaction.node_{{ this }}_isNodeDirty = true;
            {{/each}}
            {{/if}}
          {{/each}}

            g_transaction.node_{{id}}_isNodeDirty = false;
            detail::clearTimeout(&node_{{ id }});
        }
    }
  {{/eachDeferNode}}

    // Evaluate all dirty nodes
  {{#eachNonConstantNode nodes}}
    { // {{ ns patch }} #{{ id }}
    {{#if (hasUpstreamErrorRaisers this)}}

      {{#if patch.catchesErrors}}
        if (g_transaction.node_{{id}}_isNodeDirty) {
          {{!--
            // finding upstream errors for each individual input
            // matters only if a node is a catcher
          --}}
          {{#eachInputPinWithUpstreamRaisers inputs}}
            bool error_input_{{ pinKey }} = false;
            {{#each upstreamErrorRaisers}}
            error_input_{{ ../pinKey }} |= node_{{ nodeId }}.outputHasError_{{ pinKey }};
            {{/each}}
          {{/eachInputPinWithUpstreamRaisers}}
      {{else}}
        if (g_transaction.node_{{id}}_hasUpstreamError) {
          {{#each outputs}}
            {{#each to}}
            g_transaction.node_{{this}}_hasUpstreamError = true;
            g_transaction.node_{{this}}_isNodeDirty = true;
            {{/each}}
          {{/each}}
        } else if (g_transaction.node_{{id}}_isNodeDirty) {
      {{/if}}
    {{else}}
        if (g_transaction.node_{{id}}_isNodeDirty) {
    {{/if}}
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN({{ id }});

            {{ns patch }}::ContextObject ctxObj;
            ctxObj._node = &node_{{ id }};
          {{#if patch.usesNodeId}}
            ctxObj._nodeId = {{ id }};
          {{/if}}

          {{#if patch.catchesErrors}}
            {{#each inputs}}
            ctxObj._error_input_{{ pinKey }} = {{#if (hasUpstreamErrorRaisers this)~}}
                                                 error_input_{{ pinKey }}
                                               {{~else~}}
                                                 0
                                               {{~/if~}};
            {{/each}}
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
            ctxObj._isInputDirty_{{ pinKey }} = g_transaction.node_{{fromNodeId}}_isOutputDirty_{{ fromPinKey }};
            {{else}}
            ctxObj._isInputDirty_{{ pinKey }} = true;
            {{/if}}
            {{/if}}
          {{/eachLinkedInput}}

          {{#eachDirtyablePin outputs}}
            ctxObj._isOutputDirty_{{ pinKey }} = false;
          {{/eachDirtyablePin}}

          {{#if patch.raisesErrors}}
            ErrorFlags previousErrorFlags = node_{{ id }}.errorFlags;
            // give the node a chance to recover from it's own previous errors
            node_{{ id }}.errorFlags = 0;
          {{/if}}

            {{ ns patch }}::evaluate(&ctxObj);

            // transfer dirtiness state from context to g_transaction
          {{#eachDirtyablePin outputs}}
            g_transaction.node_{{ ../id }}_isOutputDirty_{{ pinKey }} = ctxObj._isOutputDirty_{{ pinKey }};
          {{/eachDirtyablePin}}

          {{#if patch.raisesErrors}}
            if (previousErrorFlags != node_{{ id }}.errorFlags) {
                detail::printErrorToDebugSerial({{ id }}, node_{{ id }}.errorFlags);
            }

            if (node_{{ id }}.errorFlags) {
              {{#each outputs}}
                if (node_{{ ../id }}.outputHasError_{{ pinKey }}) {
                  {{#each to}}
                    g_transaction.node_{{this}}_hasUpstreamError = true;
                  {{/each}}
                }
              {{/each}}
            }
          {{/if}}

            // mark downstream nodes dirty
          {{#each outputs }}
            {{#if isDirtyable ~}}
            {{#each to}}
            g_transaction.node_{{ this }}_isNodeDirty |= g_transaction.node_{{ ../../id }}_isOutputDirty_{{ ../pinKey }};
            {{/each}}
            {{else}}
            {{#each to}}
            g_transaction.node_{{this}}_isNodeDirty = true;
            {{/each}}
            {{/if}}
          {{/each}}
        }
    }
  {{/eachNonConstantNode}}

    // Сlean errors from pulse outputs
  {{#eachNonConstantNode nodes}}
    {{#if patch.raisesErrors}}
    {{#eachPulseOutput patch.outputs}}
    if (node_{{ ../id }}.outputHasError_{{ pinKey }}) {
      node_{{ ../id }}.outputHasError_{{ pinKey }} = false;
      detail::printErrorToDebugSerial({{ ../id }}, node_{{ ../id }}.errorFlags);
    }
    {{/eachPulseOutput}}
    {{/if}}
  {{/eachNonConstantNode}}

    // Clear dirtieness and timeouts for all nodes and pins
    memset(&g_transaction, 0, sizeof(g_transaction));

  {{#eachNodeUsingTimeouts nodes}}
    detail::clearStaleTimeout(&node_{{ id }});
  {{/eachNodeUsingTimeouts}}

    XOD_TRACE_F("Transaction completed, t=");
    XOD_TRACE_LN(millis());
}

} // namespace xod
