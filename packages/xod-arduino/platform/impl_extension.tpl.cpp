<%!-- Template for GENERATED_CODE token inside each patch implementation --%>
<%!-- Accepts the Node context --%>

struct Storage {
    State state;
  <% #each inputs %>
    PinRef input_<% toPinKey %>;
  <% /each %>
  <% #each outputs %>
    OutputPin<<% type %>> output_<% pinKey %>;
  <% /each %>
};

enum Inputs : PinKey {
  <% #each inputs %>
    <% toPinKey %> = offsetof(Storage, input_<% toPinKey %>)
  <% /each %>
};

enum Outputs : PinKey {
  <% #each outputs %>
    <% pinKey %> = offsetof(Storage, output_<% pinKey %>) | (0 << PIN_KEY_OFFSET_BITS)
  <% /each %>
};
