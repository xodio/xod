{{!-- Template for GENERATED_CODE token inside each patch implementation --}}
{{!-- Accepts the Node context --}}

struct Storage {
    State state;
  {{#each inputs}}
    PinRef input_{{ pinKey }};
  {{/each}}
  {{#each outputs}}
    OutputPin<{{ type }}> output_{{ pinKey }};
  {{/each}}
};

State* getState(NodeId nid) {
    return reinterpret_cast<State*>(storages[nid]);
}

{{#each inputs}}
using input_{{ pinKey }} = InputDescriptor<{{ type }}, offsetof(Storage, input_{{ pinKey }})>;
{{/each}}

{{#each outputs}}
using output_{{ pinKey }} = OutputDescriptor<{{ type }}, offsetof(Storage, output_{{ pinKey }}), {{@index}}>;
{{/each}}
