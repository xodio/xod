struct State {
  TimeMs nextTrig;
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid, State* state) {
    TimeMs tNow = transactionTime();
    TimeMs dt = getNumber(nid, Inputs::IVAL) * 1000;
    TimeMs tNext = tNow + dt;

    if (isInputDirty(nid, Inputs::IVAL)) {
        if (dt == 0) {
            state->nextTrig = 0;
            clearTimeout(nid);
        } else if (state->nextTrig < tNow || state->nextTrig > tNext) {
            state->nextTrig = tNext;
            setTimeout(nid, dt);
        }
    } else {
        // It was a scheduled tick
        emitLogic(nid, Outputs::TICK, 1);
        state->nextTrig = tNext;
        setTimeout(nid, dt);
    }
}
