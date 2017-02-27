<%!-- Template for GENERATED_CODE token inside each patch implementation --%>
<%!-- Accepts the Node context --%>

struct Storage {
    State state;
  <%#each inputs %>
    PinRef input_<% pinKey %>;
  <%/each %>
  <%#each outputs %>
    OutputPin<<% type %>> output_<% pinKey %>;
  <%/each %>
};

enum Inputs : PinKey {
  <%#each inputs %>
    <% pinKey %> = offsetof(Storage, input_<% pinKey %>)<%#unless @last %>,<%/unless %>
  <%/each %>
};

enum Outputs : PinKey {
  <%#each outputs %>
    <% pinKey %> = offsetof(Storage, output_<% pinKey %>) | (0 << PIN_KEY_OFFSET_BITS)<%#unless @last %>,<%/unless %>
  <%/each %>
};
