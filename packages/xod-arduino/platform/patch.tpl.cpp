{{#each implBlocks}}
{{#if (eq type "global")}}
{{ contents }}
{{else if (eq type "nodespace")}}
namespace xod {
namespace {{ ns ../patch }} {
{{ contents }}
} // namespace {{ ns ../patch }}
} // namespace xod
{{else if (eq type "node")}}
namespace xod {
namespace {{ ns ../patch }} {
{{> patchTemplateDefinition .. }}
struct Node {
{{ indent ../patchPinTypes }}

{{ unindent meta }}

{{ indent ../generatedCode }}

{{ contents }}
};
} // namespace {{ ns ../patch }}
} // namespace xod
{{/if}}
{{/each}}
