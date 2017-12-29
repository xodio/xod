import * as R from 'ramda';
import * as XP from 'xod-project';

// :: Patch -> [String]
const generateKeywords = R.compose(
  R.reject(R.equals('to')),
  R.split('-'),
  XP.getBaseName,
  XP.getPatchPath
);

// :: Patch -> String
const getFullDescription = R.compose(
  R.propOr('', 'content'),
  R.find(R.propEq('filename', 'README.md')),
  XP.getPatchAttachments
);

// :: [Patch] -> [{ path: String, keywords: [String], desription: String, fullDescription: string }]
export default R.map(
  R.applySpec({
    path: XP.getPatchPath,
    lib: R.compose(XP.getLibraryName, XP.getPatchPath),
    keywords: generateKeywords,
    description: XP.getPatchDescription,
    fullDescription: getFullDescription,
  })
);
