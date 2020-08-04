{{ beforeNodeDefinition }}

namespace xod {
{{> patchTemplateDefinition}}
struct {{ ns patch }} {
{{ indent patchPinTypes }}

{{ meta }}

{{ indent generatedCode }}

{{ insideNodeDefinition }}
};
} // namespace xod

{{ afterNodeDefinition }}
