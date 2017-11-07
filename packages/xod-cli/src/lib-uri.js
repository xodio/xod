import { Maybe } from 'ramda-fantasy';
import { def } from './types';

export const createLibUri = def(
  'createLibUri :: Identifier -> Identifier -> String -> LibUri',
  (orgname, libname, tag) => ({ orgname, libname, tag })
);

export const parseLibUri = def(
  'parseLibUri :: String -> Maybe LibUri',
  string =>
    Maybe.toMaybe(string.match(/^([^@/]+?)\/([^@/]+?)(?:@([^@/]+?))?$/)).map(
      ([, orgname, libname, tag]) =>
        createLibUri(orgname, libname, tag || 'latest')
    )
);

export const toStringWithoutTag = def(
  'toStringWithoutTag :: LibUri -> String',
  libUri => `${libUri.orgname}/${libUri.libname}`
);

export const toString = def(
  'toString :: LibUri -> String',
  libUri => `${toStringWithoutTag(libUri)}@${libUri.tag}`
);
