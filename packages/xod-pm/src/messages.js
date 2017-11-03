export const CANT_PARSE_LIBRARY_REQUEST = 'Canʼt parse request to fetch library data';

// :: LibParams -> String
export const cantFindLibVersion = ({ owner, name, version }) => `${owner}/${name} has no version ${version}`;
