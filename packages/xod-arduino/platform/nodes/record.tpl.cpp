node {
    meta {
        struct Type {
            {{#each inputs}}
            {{#if (isConstantType type)}}static constexpr {{/if~}}
            typeof_{{ pinKey }} _{{ @index }}
            {{~#if (isConstantType type)}} = constant_input_{{ pinKey }}{{/if}};
            {{/each}}
        };
    }

    void evaluate(Context ctx) {
        Type record;

        {{#each inputs}}
        {{#unless (isConstantType type)}}
        record._{{ @index }} = getValue<input_{{ pinKey }}>(ctx);
        {{/unless}}
        {{/each}}

        {{#each outputs}}
        emitValue<output_{{ pinKey }}>(ctx, record);
        {{/each}}
    }
}
