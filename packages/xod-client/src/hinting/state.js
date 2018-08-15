export default {
  deducedTypes: {
    // PatchPath: { NodeId: { PinKey: Either [PinType] PinType } },
  },
  errors: {
    /**
    [PatchPath]: PatchErrors :: {
      errors: {
        [ErrorType]: [Error]
      },
      nodes: {
        [NodeId]: NodeErrors :: {
          errors: {
            [ErrorType]: [Error]
          },
          pins: PinErrors :: {
            [PinKey]: {
              errors: {
                [ErrorType]: [Error]
              },
            },
          } ,
        },
      },
      links: {
        [LinkId]: LinkErrors :: {
          errors: {
            [ErrorType]: [Error]
          },
        },
      },
    },
    **/
  },
  patchSearchData: [
    /**
     * {
     *   path: PatchPath,
     *   lib: String,
     *   keywords: [String],
     *   description: String,
     *   fullDescription: String,
     * },
     */
  ],
};
