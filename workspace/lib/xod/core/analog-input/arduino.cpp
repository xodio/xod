struct State {};

{{ GENERATED_CODE }}

void evaluate(NodeId nid, State* state) {
  const int pin = (int)getNumber(nid, Inputs::PORT);
  const bool val = getLogic(nid, Inputs::UPD);
  const Number pinValue = analogRead(pin) / 1023.00;

  if (isInputDirty(nid, Inputs::PORT)) {
      ::pinMode(pin, INPUT);
  }

  emitNumber(nid, Outputs::VAL, pinValue);
}
