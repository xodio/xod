<%!-- Template for program graph --%>
<%!-- Accepts the context with list of Nodes --%>
/*=============================================================================
 *
 *
 * Program graph
 *
 *
 =============================================================================*/

namespace _program {
  <% #each nodes %>
    <% #each outputs %>
    NodeId links_<% ../id %>_<% pinKey %>[] = {
    <% #each to %>
      <% this %>,
    <% /each %>
      NO_NODE
    };
    <% /each %>

    <% owner %>::<% libName %>::<% patchName %>::Storage storage_<% id %> = {
        { }, // state
      <% #each inputs %>
        { NodeId(<% nodeId %>), <% owner %>::<% libName %>::<% patchName %>::Outputs::<% pinKey  %> }, // input_<% toPinKey %>
      <% /each %>
      <% #each outputs %>
        { <% value %>, links_<% ../id %>_<% pinKey %> }, // output_<% pinKey %>
      <% /each %>
    };
  <% /each %>

    void* storages[NODE_COUNT] = {
      <% #each nodes %>
        &storage_<% id %><% #unless @last %>,<% /unless %>
      <% /each %>
    };

    EvalFuncPtr evaluationFuncs[NODE_COUNT] = {
      <% #each nodes %>
        (EvalFuncPtr)&<% owner %>::<% libName %>::<% patchName %>::evaluate<% #unless @last %>,<% /unless %>
      <% /each %>
    };

    DirtyFlags dirtyFlags[NODE_COUNT] = {
      <% #each nodes %>
        <% #if isDirty %>-1<% else %>0<% /if %><% #unless @last %>, <% /unless %>
      <% /each %>
    };

    NodeId topology[NODE_COUNT] = {
      <% #each nodes %>
        <% id %>
      <% /each %>
    };

    TimeMs schedule[NODE_COUNT] = { 0 };
}
