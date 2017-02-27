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
  <%#each this %>
  <%mergePins %>
    <%#each outputs %>
    NodeId links_<% ../id %>_<% pinKey %>[] = { <%#each to %><% this %>, <%/each %>NO_NODE };
    <%/each %>
    <% patch/owner %>::<% patch/libName %>::<% patch/patchName %>::Storage storage_<% id %> = {
        { }, // state
      <%#each inputs %>
        <%#exists nodeId %>
        { NodeId(<% nodeId %>), <% patch/owner %>::<% patch/libName %>::<% patch/patchName %>::Outputs::<% fromPinKey  %> }, // input_<% pinKey %>
        <%else %>
        { NO_NODE, 0 }, // input_<% pinKey %>
        <%/exists %>
      <%/each %>
      <%#each outputs %>
        { <% value %>, links_<% ../id %>_<% pinKey %> }<%#unless @last %>,<%/unless %> // output_<% pinKey %>
      <%/each %>
    };
  <%/each %>

    void* storages[NODE_COUNT] = {
      <%#each this %>
        &storage_<% id %><%#unless @last %>,<%/unless %>
      <%/each %>
    };

    EvalFuncPtr evaluationFuncs[NODE_COUNT] = {
      <%#each this %>
        (EvalFuncPtr)&<% patch/owner %>::<% patch/libName %>::<% patch/patchName %>::evaluate<%#unless @last %>,<%/unless %>
      <%/each %>
    };

    DirtyFlags dirtyFlags[NODE_COUNT] = {
      <%#each this %><%#if patch.isDirty %>-1<% else %>0<%/if %><%#unless @last %>, <%/unless %><%/each %>
    };

    NodeId topology[NODE_COUNT] = {
      <%#each this %><% id %><%#unless @last %>, <%/unless %><%/each %>
    };

    TimeMs schedule[NODE_COUNT] = { 0 };
}
