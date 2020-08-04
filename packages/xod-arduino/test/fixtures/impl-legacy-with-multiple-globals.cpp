// some stuff before global block
{{#global~}}
#include <Something.h>
{{/global}}
{{#global~}}{{/global}}
// some more stuff
{{#global~}}
#include <AnotherThing.h>
{{/global}}
struct State {};
{{ GENERATED_CODE }}
void evaluate(Context ctx) {
  // blah blah
}
