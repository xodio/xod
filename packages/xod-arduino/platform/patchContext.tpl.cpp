{{!-- Template for GENERATED_CODE token inside each patch implementation --}}
{{!-- Accepts TPatch context --}}

struct Node {
    State state;
  {{#if usesTimeouts}}
    TimeMs timeoutAt;
  {{/if}}
  {{#each outputs}}
    {{ cppType type }} output_{{ pinKey }};
  {{/each}}

    union {
        struct {
          {{#eachDirtyablePin outputs}}
            bool isOutputDirty_{{ pinKey }} : 1;
          {{/eachDirtyablePin}}
            bool isNodeDirty : 1;
        };

        DirtyFlags dirtyFlags;
    };
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
  {{#if usesNodeId}}
    uint16_t _nodeId;
  {{/if}}

  {{#each inputs}}
    {{ cppType type }} _input_{{ pinKey }};
  {{/each}}

  {{#eachDirtyablePin inputs}}
    bool _isInputDirty_{{ pinKey }};
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
    return ctx->_input_{{ pinKey }};
}
{{/each}}
{{#each outputs}}
template<> {{ cppType type }} getValue<output_{{ pinKey }}>(Context ctx) {
    return ctx->_node->output_{{ pinKey }};
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
    ctx->_node->output_{{ pinKey }} = val;
  {{#if isDirtyable}}
    ctx->_node->isOutputDirty_{{ pinKey }} = true;
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
