{{ beforeNodeDefinition }}

namespace xod {
{{> patchTemplateDefinition}}
struct {{ ns patch }} {
{{ indent patchPinTypes }}

{{ unindent meta }}

{{ indent generatedCode }}

{{ insideNodeDefinition }}
};
} // namespace xod

{{ afterNodeDefinition }}
