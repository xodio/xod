#include <XColorPattern.h>

node {
    meta {
        using Type = Pattern*;
    }

    Pattern pattern;

    void evaluate(Context ctx) {
        emitValue<output_PAT>(ctx, &pattern);
    }
}
