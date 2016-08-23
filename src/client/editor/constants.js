export const EDITOR_MODE = {
  CREATING_NODE: 'creatingNode',
  EDITING: 'editing',
  LINKING: 'linking',
  PANNING: 'panning',

  get DEFAULT() {
    return this.EDITING;
  },
};
