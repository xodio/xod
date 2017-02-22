<%!-- Template for program graph --%>
<%!-- Accepts the context with list of Nodes --%>
/*=============================================================================
 *
 *
 * Native node implementations
 *
 *
 =============================================================================*/

<% #each nodes %>
namespace <% owner %> { namespace <% libName %> { namespace <% patchName %> {
    <% implementation %>
}}}
<% /each %>
