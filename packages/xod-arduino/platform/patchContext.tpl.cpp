{{!-- Accepts TPatch context --}}

{{#each outputs}}
{{#if isOutputSelf }}
typedef Type TypeOf{{ pinKey }};
{{/if}}
{{/each}}

{{#each inputs}}
struct input_{{ pinKey }} { };
{{/each}}
{{#each outputs}}
struct output_{{ pinKey }} { };
{{/each}}

{{#each inputs}}
static const identity<TypeOf{{ pinKey }}> getValueType(input_{{ pinKey }}) {
  return identity<TypeOf{{ pinKey }}>();
}
{{/each}}
{{#each outputs}}
static const identity<TypeOf{{ pinKey }}> getValueType(output_{{ pinKey }}) {
  return identity<TypeOf{{ pinKey }}>();
}
{{/each}}


{{#if raisesErrors}}
union NodeErrors {
    struct {
      {{#each outputs}}
        bool output_{{ pinKey }} : 1;
      {{/each}}
    };

    ErrorFlags flags = 0;
};
{{/if}}

{{#if raisesErrors}}
NodeErrors errors = {};
{{/if}}
{{#if usesTimeouts}}
TimeMs timeoutAt = 0;
{{/if}}

{{#eachNonPulseOrConstant outputs}}
TypeOf{{ pinKey }} _output_{{ pinKey }};
{{/eachNonPulseOrConstant}}

State state;

{{ ns this }} (
  {{~#eachNonPulseOrConstant outputs ~}}
    TypeOf{{ pinKey }} output_{{ pinKey }}{{#unless @last}}, {{/unless ~}}
  {{/eachNonPulseOrConstant ~}}
) {
  {{#eachNonPulseOrConstant outputs}}
    _output_{{ pinKey }} = output_{{ pinKey }};
  {{/eachNonPulseOrConstant}}
}

struct ContextObject {
  {{#if catchesErrors}}
    {{#each inputs}}
    uint8_t _error_input_{{ pinKey }};
    {{/each}}
  {{/if}}
  {{#if usesNodeId}}
    uint16_t _nodeId;
  {{/if}}

  {{#eachNonPulseOrConstant inputs}}
    TypeOf{{ pinKey }} _input_{{ pinKey }};
  {{/eachNonPulseOrConstant}}

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

State* getState(__attribute__((unused)) Context ctx) {
    return &state;
}

{{#if usesNodeId}}
uint16_t getNodeId(Context ctx) {
    return ctx->_nodeId;
}
{{/if}}

{{#if usesTimeouts}}
void setTimeout(__attribute__((unused)) Context ctx, TimeMs timeout) {
    this->timeoutAt = transactionTime() + timeout;
}

void clearTimeout(__attribute__((unused)) Context ctx) {
    detail::clearTimeout(this);
}

bool isTimedOut(__attribute__((unused)) const Context ctx) {
    return detail::isTimedOut(this);
}
{{/if}}

template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
    return getValue(ctx, identity<PinT>());
}

template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            "{{#each inputs}} input_{{pinKey}}{{/each}}" \
            "{{#each outputs}} output_{{pinKey}}{{/each}}");
}

{{#each inputs}}
TypeOf{{ pinKey }} getValue(Context ctx, identity<input_{{ pinKey }}>) {
{{#if (isConstantType type)}}
    return constant_input_{{ pinKey }};
{{else if (isPulse type)}}
    return Pulse();
{{else}}
    return ctx->_input_{{ pinKey }};
{{/if}}
}
{{/each}}
{{#each outputs}}
TypeOf{{ pinKey }} getValue(Context ctx, identity<output_{{ pinKey }}>) {
{{#if (isConstantType type)}}
    return constant_output_{{ pinKey }};
{{else if (isPulse type)}}
    return Pulse();
{{else}}
    return this->_output_{{ pinKey }};
{{/if}}
}
{{/each}}

template<typename InputT> bool isInputDirty(Context ctx) {
    return isInputDirty(ctx, identity<InputT>());
}

template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            "{{#eachDirtyablePin inputs}} input_{{pinKey}}{{/eachDirtyablePin}}");
    return false;
}

{{#eachDirtyablePin inputs}}
bool isInputDirty(Context ctx, identity<input_{{ pinKey }}>) {
    return ctx->_isInputDirty_{{ pinKey }};
}
{{/eachDirtyablePin}}

template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
    emitValue(ctx, val, identity<OutputT>());
}

template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            "{{#each outputs}} output_{{pinKey}}{{/each}}");
}

{{#each outputs}}
void emitValue(Context ctx, TypeOf{{ pinKey }} val, identity<output_{{ pinKey }}>) {
  {{#unless (or (isPulse type) (isConstantType type))}}
    this->_output_{{ pinKey }} = val;
  {{/unless}}
  {{#if isDirtyable}}
    ctx->_isOutputDirty_{{ pinKey }} = true;
  {{/if}}
  {{#if ../raisesErrors}}
    {{#if ../isDefer}}if (isEarlyDeferPass()) {{/if}}this->errors.output_{{ pinKey }} = false;
  {{/if}}
}
{{/each}}

{{#if raisesErrors}}
template<typename OutputT> void raiseError(Context ctx) {
    raiseError(ctx, identity<OutputT>());
}

template<typename OutputT> void raiseError(Context ctx, identity<OutputT>) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            "{{#each outputs}} output_{{pinKey}}{{/each}}");
}

{{#each outputs}}
void raiseError(Context ctx, identity<output_{{ pinKey }}>) {
    this->errors.output_{{ pinKey }} = true;
  {{#if isDirtyable}}
    ctx->_isOutputDirty_{{ pinKey }} = true;
  {{/if}}
}
{{/each}}

void raiseError(Context ctx) {
  {{#each outputs}}
    this->errors.output_{{ pinKey }} = true;
    {{#if isDirtyable}}
    ctx->_isOutputDirty_{{ pinKey }} = true;
    {{/if}}
  {{/each}}
}
{{/if}} {{!-- raisesErrors --}}

{{#if catchesErrors}}
template<typename InputT> uint8_t getError(Context ctx) {
    return getError(ctx, identity<InputT>());
}

template<typename InputT> uint8_t getError(Context ctx, identity<InputT>) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            "{{#each inputs}} input_{{pinKey}}{{/each}}");
    return 0;
}

{{#each inputs}}
uint8_t getError(Context ctx, identity<input_{{ pinKey }}>) {
    return ctx->_error_input_{{ pinKey }};
}
{{/each}}
{{/if}} {{!-- catchesErrors --}}
