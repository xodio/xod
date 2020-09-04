{{!-- Accepts TPatch context --}}

{{!--
// Types for "templatable" inputs are passed as template arguments
--}}
{{#each inputs}}
{{#unless isTemplatableCustomTypePin}}
typedef {{ cppType type }} typeof_{{ pinKey }};
{{/unless}}
{{/each}}

{{!--
// Types for "templatable" outputs must be defined manually,
// unless they can be "short-cirquited" to a matching input pin.
// Types for "output-self" are defined later, by `patchContext.tpl.cpp`,
// after user defines `Type` because the depend on this `Type`.
--}}
{{#each outputs}}
{{#unless (or isTemplatableCustomTypePin isOutputSelf) }}
typedef {{ cppType type }} typeof_{{ pinKey }};
{{/unless}}
{{#if (and isTemplatableCustomTypePin shortCirquitInputKey )}}
typedef typeof_{{ shortCirquitInputKey  }} typeof_{{ pinKey }};
{{/if}}
{{/each}}
