{{ globals }}

namespace xod {
{{> patchTemplateDefinition}}
struct {{ ns patch }} {
{{ indent patchPinTypes }}

{{ indent beforeNodeImplementation }}

{{ indent generatedCode }}

    State state;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

{{ indent insideNodeImplementation }}
};
} // namespace xod
