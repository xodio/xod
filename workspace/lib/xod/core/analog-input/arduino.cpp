struct State {};

{{ GENERATED_CODE }}

void evaluate(NodeId nid, State* state) {
  const int pin = (int)getNumber(nid, Inputs::PORT);
  const bool val = getLogic(nid, Inputs::UPD);
  const float pinValue = analogRead(A4) / 1023.00;

  if (isInputDirty(nid, Inputs::PORT)) {
      ::pinMode(pin, OUTPUT);
  }

  emitNumber(nid, Outputs::VAL, pinValue);
}
