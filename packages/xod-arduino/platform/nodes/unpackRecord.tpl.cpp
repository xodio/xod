node {
    // Define types for templatable custom outputs
    meta {
      {{#each inputs}}
      {{#each ../outputs}}
      {{#if isTemplatableCustomTypePin}}
        typedef decltype(get_member_type(&typeof_{{ ../pinKey }}::_{{ @index }})) typeof_{{ pinKey }};
      {{/if}}
      {{/each}}
      {{/each}}
    }

    // Define constant outputs
    {{#each inputs}}
    {{#each ../outputs}}
    {{#if (isConstantType type)}}
        static constexpr typeof_{{ pinKey }} constant_output_{{ pinKey }} = typeof_{{ ../pinKey }}::_{{ @index }};
    {{/if}}
    {{/each}}
    {{/each}}
    void evaluate(Context ctx) {
        {{#each inputs}}
        auto record = getValue<input_{{ pinKey }}>(ctx);
        {{/each}}
        {{#each outputs}}
        {{#unless (isConstantType type)}}
        emitValue<output_{{ pinKey }}>(ctx, record._{{ @index }});
        {{/unless}}
        {{/each}}
    }
}
