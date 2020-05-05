
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

// outputs of constant nodes
{{#each nodes}}
{{~ mergePins }}
{{~#if patch.isConstant}}
{{~#eachNonPulse outputs ~}}
{{ decltype type value }} node_{{ ../id }}_output_{{ pinKey }} = {{ cppValue type value }};
{{/eachNonPulse ~}}
{{/if~}}
{{/each}}

#pragma GCC diagnostic pop

struct TransactionState {
{{#each nodes}}
{{#unless patch.isConstant}}
    bool node_{{id}}_isNodeDirty : 1;
  {{#each outputs}}
    {{#if (shouldOutputStoreDirtyness this)}}
    bool node_{{ ../id }}_isOutputDirty_{{ pinKey }} : 1;
    {{/if}}
  {{/each}}
  {{#if (needsHasUpstreamErrorFlag this)}}
    bool node_{{id}}_hasUpstreamError : 1;
  {{/if}}
{{/unless}}
{{/each}}
    TransactionState() {
    {{#each nodes}}
      {{#unless patch.isConstant}}
        node_{{id}}_isNodeDirty = true;
        {{#eachDirtyablePin outputs}}
        {{#if (shouldOutputStoreDirtyness this)}}
        node_{{ ../id }}_isOutputDirty_{{ pinKey }} = {{ isDirtyOnBoot }};
        {{/if}}
        {{/eachDirtyablePin}}
      {{/unless}}
    {{/each}}
    }
};

TransactionState g_transaction;

{{#each nodes}}
{{#unless patch.isConstant}}

typedef {{ ns patch }}{{#if (or (containsConstantInputs inputs) (containsTemplatableCustomTypeInputs inputs))~}}
<
  {{~#each (constantInputs inputs)~}}
    {{~#if fromPatch.isConstant~}}
      node_{{ fromNodeId }}_output_{{ fromPinKey }}
    {{~else~}}
      TypeOfNode{{ fromNodeId }}::constant_output_{{ fromPinKey }}{{!-- // TODO: a proper name? --}}
    {{~/if~}}
    {{~#unless @last}}, {{/unless}}
  {{~/each~}}
  {{~#if (and (containsConstantInputs inputs) (containsTemplatableCustomTypeInputs inputs))}}, {{/if}}
  {{~#each (templatableCustomTypeInputs inputs)~}}
    TypeOfNode{{ fromNodeId }}::TypeOf{{ fromPinKey }}
    {{~#unless @last}}, {{/unless}}
  {{~/each~}}
>
{{~/if}} TypeOfNode{{ id }};
{{!-- // TODO: templating goes here --}}
TypeOfNode{{ id }} node_{{ id }} = TypeOfNode{{ id }}(
{{~#eachNonPulseOrConstant outputs~}}
  {{ cppValue type value }}
  {{~#unless @last}}, {{/unless}}
{{~/eachNonPulseOrConstant~}}
);
{{/unless}}
{{/each}}

#if defined(XOD_DEBUG) || defined(XOD_SIMULATION)
namespace detail {
void handleDebugProtocolMessages() {
    {{#withTetheringInetNode nodes}}
    bool tetheringInetNodeReceivingData = xod__debug__tethering_inet::TetheringInternet::isReceiving();
    {{/withTetheringInetNode}}
    bool rewindToEol = true;

    if (
      XOD_DEBUG_SERIAL.available() > 0 &&
      {{#withTetheringInetNode nodes}}
      !tetheringInetNodeReceivingData &&
      {{/withTetheringInetNode}}
      XOD_DEBUG_SERIAL.find("+XOD:", 5)
    ) {
        int tweakedNodeId = XOD_DEBUG_SERIAL.parseInt();

        switch (tweakedNodeId) {
          {{#withTetheringInetNode nodes}}
            case {{ id }}:
              xod__debug__tethering_inet::TetheringInternet::beginReceiving(XOD_DEBUG_SERIAL.parseInt());
              rewindToEol = false;
              XOD_DEBUG_SERIAL.read(); // :
              // The rest of data should be read by nodes
              break;
          {{/withTetheringInetNode}}
          {{#eachLinkedTweakNode nodes}}
            case {{ id }}:
                {
                {{#switchByTweakType patch.patchPath}}
                  {{#case "number"}}
                    node_{{ id }}._output_OUT = XOD_DEBUG_SERIAL.parseFloat();
                  {{/case}}
                  {{#case "byte"}}
                    node_{{ id }}._output_OUT = XOD_DEBUG_SERIAL.parseInt();
                  {{/case}}
                  {{#case "pulse"}}
                    {{!-- nothing to do here, only marking output as dirty is required --}}
                  {{/case}}
                  {{#case "boolean"}}
                    node_{{ id }}._output_OUT = (bool)XOD_DEBUG_SERIAL.parseInt();
                  {{/case}}
                  {{#case "string"}}
                    XOD_DEBUG_SERIAL.read(); // consume the ':' separator that was left after parsing node id
                    size_t readChars = XOD_DEBUG_SERIAL.readBytesUntil('\r', node_{{ id }}.state.buff, {{getStringTweakLength patch.patchPath}});
                    node_{{ id }}.state.buff[readChars] = '\0';
                  {{/case}}
                  {{#case "xod/color/color"}}
                    node_{{ id }}._output_OUT = {
                      /* RGB */
                      (uint8_t)XOD_DEBUG_SERIAL.parseInt(),
                      (uint8_t)XOD_DEBUG_SERIAL.parseInt(),
                      (uint8_t)XOD_DEBUG_SERIAL.parseInt()
                    };
                  {{/case}}
                {{/switchByTweakType}}
                    rewindToEol = true;
                    // to run evaluate and mark all downstream nodes as dirty
                    g_transaction.node_{{ id }}_isNodeDirty = true;
                    g_transaction.node_{{ id }}_isOutputDirty_OUT = true;
                }
                break;
          {{/eachLinkedTweakNode}}
        }

        if (rewindToEol)
            XOD_DEBUG_SERIAL.find('\n');
    }
}
} // namespace detail
#endif

void handleDefers() {
  {{#eachDeferNode nodes}}
    {
        if (g_transaction.node_{{id}}_isNodeDirty) {
          {{#eachInputPinWithUpstreamRaisers inputs}}
            bool error_input_{{ pinKey }} = false;
            {{#each upstreamErrorRaisers}}
            error_input_{{ ../pinKey }} |= node_{{ nodeId }}.errors.output_{{ pinKey }};
            {{/each}}
          {{/eachInputPinWithUpstreamRaisers}}

            XOD_TRACE_F("Trigger defer node #");
            XOD_TRACE_LN({{ id }});

            TypeOfNode{{ id }}::ContextObject ctxObj;
          {{#each inputs}}
            {{#if isDirtyable}}
            ctxObj._isInputDirty_{{ pinKey }} = false;
            {{/if}}
          {{/each}}

          {{#eachLinkedInput inputs}}
            {{!--
              // We refer to node_42.output_FOO as data source in case
              // of a regular node and directly use node_42_output_VAL
              // initial value constexpr in case of a constant. It’s
              // because store no Node structures at the global level
            --}}
            {{#unless (or (isPulse type) (isConstantType type))}}
            ctxObj._input_{{ pinKey }} = node_{{ fromNodeId }}
                {{~#unless fromPatch.isConstant }}.{{/unless~}}
                _output_{{ fromPinKey }};
            {{/unless}}
          {{/eachLinkedInput}}

          {{#each inputs}}
            ctxObj._error_input_{{ pinKey }} = {{#if (hasUpstreamErrorRaisers this)~}}
                                                 error_input_{{ pinKey }}
                                               {{~else~}}
                                                 0
                                               {{~/if~}};
          {{/each}}

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
          {{#eachDirtyablePin outputs}}
            ctxObj._isOutputDirty_{{ pinKey }} = false;
          {{/eachDirtyablePin}}

            TypeOfNode{{ id }}::NodeErrors previousErrors = node_{{ id }}.errors;

            {{!--
              // Сlean errors from pulse outputs
            --}}
            {{#eachPulseOutput patch.outputs}}
            node_{{ ../id }}.errors.output_{{ pinKey }} = false;
            {{/eachPulseOutput}}

            node_{{ id }}.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
          {{#eachDirtyablePin outputs}}
            {{#if (shouldOutputStoreDirtyness this)}}
            g_transaction.node_{{ ../id }}_isOutputDirty_{{ pinKey }} = ctxObj._isOutputDirty_{{ pinKey }};
            {{/if}}
          {{/eachDirtyablePin}}

            if (previousErrors.flags != node_{{ id }}.errors.flags) {
                detail::printErrorToDebugSerial({{ id }}, node_{{ id }}.errors.flags);

                // if an error was just raised or cleared from an output,
                // mark nearest downstream error catchers as dirty
              {{#each outputs}}
                if (node_{{ ../id }}.errors.output_{{ pinKey }} != previousErrors.output_{{ pinKey }}) {
                  {{#each nearestDownstreamCatchers}}
                    g_transaction.node_{{this}}_isNodeDirty = true;
                  {{/each}}
                }
              {{/each}}

              {{#eachPulseOutput outputs}}
                // if a pulse output was cleared from error, mark downstream nodes as dirty
                // (no matter if a pulse was emitted or not)
                if (previousErrors.output_{{ pinKey }} && !node_{{ ../id }}.errors.output_{{ pinKey }}) {
                  {{#each to}}
                    g_transaction.node_{{id}}_isNodeDirty = true;
                  {{/each}}
                }
              {{/eachPulseOutput}}
            }

            // mark downstream nodes dirty
          {{#each outputs }}
            {{#each to}}
            {{#if doesAffectDirtyness}}
            {{#if ../isDirtyable}}
            g_transaction.node_{{ id }}_isNodeDirty |= g_transaction.node_{{ ../../id }}_isOutputDirty_{{ ../pinKey }};
            {{else}}
            g_transaction.node_{{ id }}_isNodeDirty = true;
            {{/if}}
            {{/if}}
            {{/each}}
          {{/each}}

            g_transaction.node_{{id}}_isNodeDirty = false;
            detail::clearTimeout(&node_{{ id }});
        }

        // propagate the error hold by the defer node
        if (node_{{ id }}.errors.flags) {
          {{#each outputs}}
            if (node_{{ ../id }}.errors.output_{{ pinKey }}) {
              {{#each to}}
                g_transaction.node_{{id}}_hasUpstreamError = true;
              {{/each}}
            }
          {{/each}}
        }
    }
  {{/eachDeferNode}}
}

void runTransaction() {
    g_transactionTime = millis();

    XOD_TRACE_F("Transaction started, t=");
    XOD_TRACE_LN(g_transactionTime);

#if defined(XOD_DEBUG) || defined(XOD_SIMULATION)
    detail::handleDebugProtocolMessages();
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
    // evaluate on the regular pass only if it receives a new value again.
    if (!isSettingUp()) {
        g_isEarlyDeferPass = true;
        handleDefers();
        g_isEarlyDeferPass = false;
    }

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
            error_input_{{ ../pinKey }} |= node_{{ nodeId }}.errors.output_{{ pinKey }};
            {{/each}}
          {{/eachInputPinWithUpstreamRaisers}}
      {{else}}
        if (g_transaction.node_{{id}}_hasUpstreamError) {
          {{#each outputs}}
            {{#each to}}
            g_transaction.node_{{id}}_hasUpstreamError = true;
            {{/each}}
          {{/each}}
        } else if (g_transaction.node_{{id}}_isNodeDirty) {
      {{/if}}
    {{else}}
        if (g_transaction.node_{{id}}_isNodeDirty) {
    {{/if}}
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN({{ id }});

            TypeOfNode{{ id }}::ContextObject ctxObj;
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
            {{#unless (or (isPulse type) (isConstantType type))}}
            ctxObj._input_{{ pinKey }} = node_{{ fromNodeId }}
                {{~#unless fromPatch.isConstant }}.{{/unless~}}
                _output_{{ fromPinKey }};
            {{/unless}}
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

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
          {{#eachDirtyablePin outputs}}
            ctxObj._isOutputDirty_{{ pinKey }} = {{#if (isLinkedTweakNode ../this) ~}}
                                                   g_transaction.node_{{ ../id }}_isOutputDirty_{{ pinKey }}
                                                 {{~else~}}
                                                   false
                                                 {{~/if~}};
          {{/eachDirtyablePin}}

          {{#if patch.raisesErrors}}
            TypeOfNode{{ id }}::NodeErrors previousErrors = node_{{ id }}.errors;

            {{#unless patch.isDefer}}
            {{!--
              // Сlean errors from pulse outputs
            --}}
            {{#eachPulseOutput patch.outputs}}
            node_{{ ../id }}.errors.output_{{ pinKey }} = false;
            {{/eachPulseOutput}}
            {{/unless}}
          {{/if}}

            node_{{ id }}.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
          {{#eachDirtyablePin outputs}}
            {{#if (shouldOutputStoreDirtyness this)}}
            g_transaction.node_{{ ../id }}_isOutputDirty_{{ pinKey }} = ctxObj._isOutputDirty_{{ pinKey }};
            {{/if}}
          {{/eachDirtyablePin}}

          {{#if patch.raisesErrors}}
            if (previousErrors.flags != node_{{ id }}.errors.flags) {
                detail::printErrorToDebugSerial({{ id }}, node_{{ id }}.errors.flags);

                // if an error was just raised or cleared from an output,
                // mark nearest downstream error catchers as dirty
              {{#each outputs}}
                if (node_{{ ../id }}.errors.output_{{ pinKey }} != previousErrors.output_{{ pinKey }}) {
                  {{#each nearestDownstreamCatchers}}
                    g_transaction.node_{{this}}_isNodeDirty = true;
                  {{/each}}
                }
              {{/each}}

                // if a pulse output was cleared from error, mark downstream nodes as dirty
                // (no matter if a pulse was emitted or not)
              {{#eachPulseOutput outputs}}
                if (previousErrors.output_{{ pinKey }} && !node_{{ ../id }}.errors.output_{{ pinKey }}) {
                  {{#each to}}
                    g_transaction.node_{{ id }}_isNodeDirty = true;
                  {{/each}}
                }
              {{/eachPulseOutput}}
            }
          {{/if}}

            // mark downstream nodes dirty
          {{#each outputs }}
            {{#each to}}
            {{#if doesAffectDirtyness}}
            {{#if ../isDirtyable}}
            g_transaction.node_{{ id }}_isNodeDirty |= g_transaction.node_{{ ../../id }}_isOutputDirty_{{ ../pinKey }};
            {{else}}
            g_transaction.node_{{ id }}_isNodeDirty = true;
            {{/if}}
            {{/if}}
            {{/each}}
          {{/each}}
        }

      {{#if patch.raisesErrors}}
        // propagate errors hold by the node outputs
        if (node_{{ id }}.errors.flags) {
          {{#each outputs}}
            if (node_{{ ../id }}.errors.output_{{ pinKey }}) {
              {{#each to}}
                g_transaction.node_{{ id }}_hasUpstreamError = true;
              {{/each}}
            }
          {{/each}}
        }
      {{/if}}
    }
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
