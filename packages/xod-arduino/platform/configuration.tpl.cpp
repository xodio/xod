<%!-- Template for program configuration block --%>
<%!-- Accepts the Config context --%>
/*=============================================================================
 *
 *
 * Configuration
 *
 *
 =============================================================================*/

#define NODE_COUNT          <% NODE_COUNT %>
#define MAX_OUTPUT_COUNT    <% MAX_OUTPUT_COUNT %>

// Uncomment to trace the program in the Serial Monitor
<% #unless XOD_DEBUG %>//<% /unless %>#define XOD_DEBUG
