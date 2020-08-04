{{ beforeDefnode }}

namespace xod {
{{> patchTemplateDefinition}}
struct {{ ns patch }} {
{{ indent patchPinTypes }}

{{ nodetypes }}

{{ indent generatedCode }}

{{ insideDefnode }}
};
} // namespace xod

{{ afterDefnode }}
