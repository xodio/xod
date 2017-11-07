import R from 'ramda';

function findMenuItem([itemLabel, ...restLabels], tpl) {
  if (R.isNil(tpl)) {
    return null;
  }

  const item = R.find(R.propEq('label', itemLabel), tpl);
  if (R.isNil(item)) {
    return null;
  } else if (R.isEmpty(restLabels)) {
    return item;
  }

  return findMenuItem(restLabels, item.submenu);
}

export const TRIGGER_MAIN_MENU_ITEM = 'TRIGGER_MAIN_MENU_ITEM';

export const subscribeToTriggerMainMenuRequests = (
  eventEmitter,
  menuTemplate
) => {
  eventEmitter.on(TRIGGER_MAIN_MENU_ITEM, pathToMenuItem => {
    const item = findMenuItem(pathToMenuItem, menuTemplate);
    if (item && typeof item.click === 'function') {
      item.click();
    }
  });
};
