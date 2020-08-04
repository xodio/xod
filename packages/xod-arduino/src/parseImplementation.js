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

const nodetypesRegExp = /\bnodetypes\s*{/;

const extractNodetypes = impl => {
  const match = impl.match(nodetypesRegExp);

  if (!match) {
    return {
      implWithoutNodetypes: impl,
      nodetypes: '',
    };
  }

  const declarationStartIndex = match.index;
  const openingBracketIndex = match.index + match[0].length;
  const closingBracketIndex = findClosingBracket(impl, openingBracketIndex);

  return {
    implWithoutNodetypes:
      impl.slice(0, declarationStartIndex) +
      impl.slice(closingBracketIndex + 1),
    nodetypes: impl.slice(openingBracketIndex, closingBracketIndex),
  };
};

const defnodeRegExp = /\bdefnode\s*{/;

const parseDefnode = impl => {
  const match = impl.match(defnodeRegExp);

  const declarationStartIndex = match.index;
  const openingBracketIndex = match.index + match[0].length;
  const closingBracketIndex = findClosingBracket(impl, openingBracketIndex);
  const declarationEndIndex =
    closingBracketIndex + (impl[closingBracketIndex + 1] === ';' ? 2 : 1);

  return {
    beforeDefnode: impl.slice(0, declarationStartIndex),
    insideDefnode: impl.slice(openingBracketIndex, closingBracketIndex),
    afterDefnode: impl.slice(declarationEndIndex),
  };
};

// Impl -> { beforeDefnode: String, insideDefnode: String, afterDefnode: String, nodetypes: String }
export default impl => {
  const { implWithoutNodetypes, nodetypes } = extractNodetypes(impl);

  const { beforeDefnode, insideDefnode, afterDefnode } = parseDefnode(
    implWithoutNodetypes
  );

  return {
    beforeDefnode,
    insideDefnode,
    afterDefnode,
    nodetypes,
  };
};
