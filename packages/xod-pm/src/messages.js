export const CANT_PARSE_LIBRARY_REQUEST = 'Canʼt parse request to fetch library data';
export const SERVICE_UNAVAILABLE = 'Service unavailable';

// :: LibParams -> String
export const cantFindLibVersion = ({ owner, name, version }) => `${owner}/${name} has no version ${version}`;

export const cantFindLibrary = ({ owner, name }) => `Library ${owner}/${name} not found`;
