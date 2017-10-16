{{!-- Template for GENERATED_CODE token inside each patch implementation --}}
{{!-- Accepts the Node context --}}

struct Storage {
    State state;
  {{#each outputs}}
    {{ cppType type }} output_{{ pinKey }};
  {{/each}}
};

struct Wiring {
    EvalFuncPtr eval;
  {{#each inputs}}
    UpstreamPinRef input_{{ pinKey }};
  {{/each}}
  {{#each outputs}}
    const NodeId* output_{{ pinKey }};
  {{/each}}
};

State* getState(NodeId nid) {
    return reinterpret_cast<State*>(getStoragePtr(nid, 0));
}

{{#each inputs}}
using input_{{ pinKey }} = InputDescriptor<{{ cppType type }}, offsetof(Wiring, input_{{ pinKey }})>;
{{/each}}

{{#each outputs}}
using output_{{ pinKey }} = OutputDescriptor<{{ cppType type }}, offsetof(Wiring, output_{{ pinKey }}), offsetof(Storage, output_{{ pinKey }}), {{@index}}>;
{{/each}}
