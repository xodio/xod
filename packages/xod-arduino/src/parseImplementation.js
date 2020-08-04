const findClosingBracket = (str, fromPos = 0) => {
  let depth = 1;
  for (let i = fromPos; i < str.length; i += 1) {
    switch (str[i]) {
      case '{':
        depth += 1;
        break;
      case '}':
        depth -= 1;
        if (depth === 0) {
          return i;
        }
        break;
      default:
        break;
    }
  }
  return -1;
};

const metaRegExp = /\bmeta\s*{/;

const extractMeta = impl => {
  const match = impl.match(metaRegExp);

  if (!match) {
    return {
      implWithoutMeta: impl,
      meta: '',
    };
  }

  const declarationStartIndex = match.index;
  const openingBracketIndex = match.index + match[0].length;
  const closingBracketIndex = findClosingBracket(impl, openingBracketIndex);

  return {
    implWithoutMeta:
      impl.slice(0, declarationStartIndex) +
      impl.slice(closingBracketIndex + 1),
    meta: impl.slice(openingBracketIndex, closingBracketIndex),
  };
};

const nodeRegExp = /\bnode\s*{/;

const parseNodeDefiniton = impl => {
  const match = impl.match(nodeRegExp);

  const declarationStartIndex = match.index;
  const openingBracketIndex = match.index + match[0].length;
  const closingBracketIndex = findClosingBracket(impl, openingBracketIndex);
  const declarationEndIndex =
    closingBracketIndex + (impl[closingBracketIndex + 1] === ';' ? 2 : 1);

  return {
    beforeNodeDefinition: impl.slice(0, declarationStartIndex),
    insideNodeDefinition: impl.slice(openingBracketIndex, closingBracketIndex),
    afterNodeDefinition: impl.slice(declarationEndIndex),
  };
};

// Impl -> { beforeNodeDefinition: String, insideNodeDefinition: String, afterNodeDefinition: String, meta: String }
export default impl => {
  const { implWithoutMeta, meta } = extractMeta(impl);

  const {
    beforeNodeDefinition,
    insideNodeDefinition,
    afterNodeDefinition,
  } = parseNodeDefiniton(implWithoutMeta);

  return {
    beforeNodeDefinition,
    insideNodeDefinition,
    afterNodeDefinition,
    meta,
  };
};
