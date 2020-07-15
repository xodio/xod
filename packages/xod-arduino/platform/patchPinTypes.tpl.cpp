{{!-- Accepts TPatch context --}}

{{!--
// Types for "templatale" inputs are passed as template arguments
--}}
{{#each inputs}}
{{#unless isTemplatableCustomTypePin}}
typedef {{ cppType type }} typeof_{{ pinKey }};
{{/unless}}
{{/each}}

{{!--
// Types for "templatale" outputs must be defined manually,
// unless they can be "short-cirquited" to a matching input pin.
// Types for "output-self" must be defined later, after user defines `Type`.
--}}
{{#each outputs}}
{{#unless (or isTemplatableCustomTypePin isOutputSelf) }}
typedef {{ cppType type }} typeof_{{ pinKey }};
{{/unless}}
{{#if (and isTemplatableCustomTypePin shortCirquitInputKey )}}
typedef typeof_{{ shortCirquitInputKey  }} typeof_{{ pinKey }};
{{/if}}
{{/each}}
