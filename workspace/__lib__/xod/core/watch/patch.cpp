struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
  if (!isInputDirty<input_IN>(ctx))
      return;

  auto line = getValue<input_IN>(ctx);

  TimeMs tNow = transactionTime();
  DEBUG_SERIAL.print(F("+XOD:"));
  DEBUG_SERIAL.print(tNow);
  DEBUG_SERIAL.print(':');
  DEBUG_SERIAL.print(ctx);
  DEBUG_SERIAL.print(':');
  for (auto it = line->iterate(); it; ++it)
      DEBUG_SERIAL.print((char)*it);
  DEBUG_SERIAL.print('\r');
  DEBUG_SERIAL.print('\n');
  DEBUG_SERIAL.flush();
}
