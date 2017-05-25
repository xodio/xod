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

namespace Inputs {
  {{#each inputs}}
    using {{ pinKey }} = InputDescriptor<{{ type }}, offsetof(Storage, input_{{ pinKey }})>;
  {{/each}}
};

enum Outputs : PinKey {
  {{#each outputs}}
    using {{ pinKey }} = OutputDescriptor<{{ type }}, offsetof(Storage, input_{{ pinKey }}), {{@index}}>;
  {{/each}}
};
