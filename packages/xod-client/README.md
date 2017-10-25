# xod-client

This package is a part of the [XOD](https://github.com/xodio/xod) project.

The package contains the most of code related to the XOD IDE user interface.
`xod-client` is build on React + Redux stack.

`xod-client` is neutral to platform. That means it doesn’t contain code
specific to a particular execution environment like browser or electron.

To make it alive a bootstrapping wrapper is required that would embed the
`xod-client` in a platform specific container. See
[`xod-client-browser`](https://github.com/xodio/xod/tree/master/packages/xod-client-browser)
[`xod-client-electron`](https://github.com/xodio/xod/tree/master/packages/xod-client-electron)
for example.

## Source code structure

The source is split into pods. Each pod is a part of whole application
which implements a single aspect of the IDE.

Each pod could contain:

- `components/` — [dumb](https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0) React components
- `containers/` — [smart](https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0) React components
- `actions.js` — Redux action dispatchers
- `actionTypes.js` — name symbols for Redux actions
- `reducer.js` — Redux reducer that operates on a pod’s state subtree
- `selectors.js` — functions to query presentational data from state subtree (see below)
- `state.js` — initial state for the pod’s subtree

To work with XOD project state a separate package
[`xod-project`](https://github.com/xodio/xod/tree/master/packages/xod-project)
is used. Reducers simply delegate state update to `xod-project`’s functions,
selectors, and components use functions from `xod-project` to access project
data. This distincion is done because project state is complex and keeping all
machinery inside standard pod layout would make it messy.

## Environment variables

- **`XOD_HOSTNAME`**
    
    XOD hostname. Default: `xod.io`
