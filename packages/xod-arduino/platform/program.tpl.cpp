
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

{{#each nodes}}
{{#unless patch.isConstant}}
{{ ns patch }}::Node node_{{ id }} = {
    {{ ns patch }}::State(), // state default
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
  {{#eachDirtyablePin outputs}}
    {{ isDirtyOnBoot }}, // {{ pinKey }} dirty
  {{/eachDirtyablePin}}
    true // node itself dirty
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
                    node_{{ id }}.isNodeDirty = true;
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
            // if a defer has an error, do not evaluate it, but spread the dirtyness
            if (!node_{{ id }}.errorFlags) {
                XOD_TRACE_F("Trigger defer node #");
                XOD_TRACE_LN({{ id }});

                {{ns patch }}::ContextObject ctxObj;
                ctxObj._node = &node_{{ id }};
                ctxObj._isInputDirty_IN = false;
                ctxObj._error_input_IN = 0;

                {{ ns patch }}::evaluate(&ctxObj);
            }

            // mark downstream nodes dirty
          {{#each outputs }}
            {{#if isDirtyable ~}}
            {{#each to}}
            node_{{ this }}.isNodeDirty |= (node_{{ ../../id }}.isOutputDirty_{{ ../pinKey }} || node_{{ ../../id }}.errorFlags);
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
    {{#if (hasUpstreamErrorRaisers this)}}
      {{!-- // finding upstream errors for each individual input --}}
      {{#eachInputPinWithUpstreamRaisers inputs}}
        bool error_input_{{ pinKey }} = false;
        {{#each upstreamErrorRaisers}}
        error_input_{{ ../pinKey }} |= node_{{ nodeId }}.outputHasError_{{ pinKey }};
        {{/each}}
      {{/eachInputPinWithUpstreamRaisers}}

      {{!-- // finding if any input has upstream errors --}}
        bool hasUpstreamError = false;
      {{#eachInputPinWithUpstreamRaisers inputs}}
        hasUpstreamError |= error_input_{{ pinKey }};
      {{/eachInputPinWithUpstreamRaisers}}

        if (node_{{ id }}.isNodeDirty {{~#unless patch.catchesErrors}} && !hasUpstreamError{{/unless}}) {
    {{else}}
        if (node_{{ id }}.isNodeDirty) {
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
            ctxObj._isInputDirty_{{ pinKey }} = node_{{ fromNodeId }}.isOutputDirty_{{ fromPinKey }};
            {{else}}
            ctxObj._isInputDirty_{{ pinKey }} = true;
            {{/if}}
            {{/if}}
          {{/eachLinkedInput}}

          {{#if patch.raisesErrors}}
#if defined(XOD_DEBUG) || defined(XOD_SIMULATION)
            ErrorFlags previousErrorFlags = node_{{ id }}.errorFlags;
#endif
            // give the node a chance to recover from it's own previous errors
            node_{{ id }}.errorFlags = 0;
          {{/if}}

            {{ ns patch }}::evaluate(&ctxObj);

          {{#if patch.raisesErrors}}
#if defined(XOD_DEBUG) || defined(XOD_SIMULATION)
            if (previousErrorFlags != node_{{ id }}.errorFlags) {
                detail::printErrorToDebugSerial({{ id }}, node_{{ id }}.errorFlags);
            }
#endif
          {{/if}}

      {{#if (hasUpstreamErrorRaisers this)}}
        }
        // even if the node did not evaluate, mark downstream nodes as
        // dirty to spread the errors to the catchers
        if (node_{{ id }}.isNodeDirty) {
      {{/if}}
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

  {{#eachNodeUsingTimeouts nodes}}
    detail::clearStaleTimeout(&node_{{ id }});
  {{/eachNodeUsingTimeouts}}

    XOD_TRACE_F("Transaction completed, t=");
    XOD_TRACE_LN(millis());
}

} // namespace xod
