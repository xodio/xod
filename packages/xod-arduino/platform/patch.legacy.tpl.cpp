{{ globals }}

namespace xod {
namespace {{ ns patch }} {
{{> patchTemplateDefinition}}
struct Node {
{{ indent patchPinTypes }}

{{ indent beforeNodeImplementation }}

{{ indent generatedCode }}

    State state;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

{{ indent insideNodeImplementation }}
};
} // namespace {{ ns patch }}
} // namespace xod
