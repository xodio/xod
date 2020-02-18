{{!-- Template for GENERATED_CODE token inside each patch implementation --}}
{{!-- Accepts TPatch context --}}

{{#if raisesErrors}}
union NodeErrors {
    struct {
      {{#each outputs}}
        bool output_{{ pinKey }} : 1;
      {{/each}}
    };

    ErrorFlags flags;
};
{{/if}}

struct Node {
  {{#if raisesErrors}}
    NodeErrors errors;
  {{/if}}
  {{#if usesTimeouts}}
    TimeMs timeoutAt;
  {{/if}}
  {{#eachNonPulse outputs}}
    {{ cppType type }} output_{{ pinKey }};
  {{/eachNonPulse}}
    State state;
};

{{#each inputs}}
struct input_{{ pinKey }} { };
{{/each}}
{{#each outputs}}
struct output_{{ pinKey }} { };
{{/each}}

template<typename PinT> struct ValueType { using T = void; };
{{#each inputs}}
template<> struct ValueType<input_{{ pinKey }}> { using T = {{ cppType type }}; };
{{/each}}
{{#each outputs}}
template<> struct ValueType<output_{{ pinKey }}> { using T = {{ cppType type }}; };
{{/each}}


struct ContextObject {
    Node* _node;
  {{#if catchesErrors}}
    {{#each inputs}}
    uint8_t _error_input_{{ pinKey }};
    {{/each}}
  {{/if}}
  {{#if usesNodeId}}
    uint16_t _nodeId;
  {{/if}}

  {{#eachNonPulse inputs}}
    {{ cppType type }} _input_{{ pinKey }};
  {{/eachNonPulse}}

  {{#eachDirtyablePin inputs}}
    bool _isInputDirty_{{ pinKey }};
  {{/eachDirtyablePin}}

  {{!--
    // Constants do not store dirtieness. They are never dirty
    // except the very first run
  --}}
  {{#eachDirtyablePin outputs}}
    bool _isOutputDirty_{{ pinKey }} : 1;
  {{/eachDirtyablePin}}
};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            "{{#each inputs}} input_{{pinKey}}{{/each}}" \
            "{{#each outputs}} output_{{pinKey}}{{/each}}");
}

{{#each inputs}}
template<> {{ cppType type }} getValue<input_{{ pinKey }}>(Context ctx) {
  {{#if (isPulse type)}}
    return Pulse();
  {{else}}
    return ctx->_input_{{ pinKey }};
  {{/if}}
}
{{/each}}
{{#each outputs}}
template<> {{ cppType type }} getValue<output_{{ pinKey }}>(Context ctx) {
  {{#if (isPulse type)}}
    return Pulse();
  {{else}}
    return ctx->_node->output_{{ pinKey }};
  {{/if}}
}
{{/each}}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            "{{#eachDirtyablePin inputs}} input_{{pinKey}}{{/eachDirtyablePin}}");
    return false;
}

{{#eachDirtyablePin inputs}}
template<> bool isInputDirty<input_{{ pinKey }}>(Context ctx) {
    return ctx->_isInputDirty_{{ pinKey }};
}
{{/eachDirtyablePin}}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            "{{#each outputs}} output_{{pinKey}}{{/each}}");
}

{{#each outputs}}
template<> void emitValue<output_{{ pinKey }}>(Context ctx, {{ cppType type }} val) {
  {{#unless (isPulse type)}}
    ctx->_node->output_{{ pinKey }} = val;
  {{/unless}}
  {{#if isDirtyable}}
    ctx->_isOutputDirty_{{ pinKey }} = true;
  {{/if}}
  {{#if ../raisesErrors}}
    {{#if ../isDefer}}if (isEarlyDeferPass()) {{/if}}ctx->_node->errors.output_{{ pinKey }} = false;
  {{/if}}
}
{{/each}}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

{{#if usesNodeId}}
uint16_t getNodeId(Context ctx) {
    return ctx->_nodeId;
}
{{/if}}


{{#if raisesErrors}}
template<typename OutputT> void raiseError(Context ctx) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            "{{#each outputs}} output_{{pinKey}}{{/each}}");
}

{{#each outputs}}
template<> void raiseError<output_{{ pinKey }}>(Context ctx) {
    ctx->_node->errors.output_{{ pinKey }} = true;
  {{#if isDirtyable}}
    ctx->_isOutputDirty_{{ pinKey }} = true;
  {{/if}}
}
{{/each}}

void raiseError(Context ctx) {
  {{#each outputs}}
    ctx->_node->errors.output_{{ pinKey }} = true;
    {{#if isDirtyable}}
    ctx->_isOutputDirty_{{ pinKey }} = true;
    {{/if}}
  {{/each}}
}

{{/if}}


{{#if catchesErrors}}

template<typename InputT> uint8_t getError(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            "{{#each inputs}} input_{{pinKey}}{{/each}}");
    return 0;
}

{{#each inputs}}
template<> uint8_t getError<input_{{ pinKey }}>(Context ctx) {
    return ctx->_error_input_{{ pinKey }};
}
{{/each}}
{{/if}}
