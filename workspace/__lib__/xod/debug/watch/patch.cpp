#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_IN
#pragma XOD error_catch enable

node {
    void evaluate(Context ctx) {
      if (!isInputDirty<input_IN>(ctx))
          return;

      auto err = getError<input_IN>(ctx);
      auto line = getValue<input_IN>(ctx);

      TimeMs tNow = transactionTime();
      XOD_DEBUG_SERIAL.print(F("+XOD:"));
      XOD_DEBUG_SERIAL.print(tNow);
      XOD_DEBUG_SERIAL.print(':');
      XOD_DEBUG_SERIAL.print(getNodeId(ctx));
      XOD_DEBUG_SERIAL.print(':');
      if (err) {
        XOD_DEBUG_SERIAL.print(F("ERR"));
      } else {
        for (auto it = line.iterate(); it; ++it)
          XOD_DEBUG_SERIAL.print((char)*it);
      }

      XOD_DEBUG_SERIAL.print('\r');
      XOD_DEBUG_SERIAL.print('\n');
      XOD_DEBUG_SERIAL.flush();
    }
}
