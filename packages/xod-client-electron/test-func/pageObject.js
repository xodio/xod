
const R = require('ramda');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
const assert = chai.assert;

//-----------------------------------------------------------------------------
// Project browser
//-----------------------------------------------------------------------------
function findProjectBrowser(client) {
  return client.element('.ProjectBrowser');
}

function clickAddPatch(client) {
  return findProjectBrowser(client).click('button[title="Add patch"]');
}

function findPatchGroup(client, groupTitle) {
  return findProjectBrowser(client).element(`.PatchGroup=${groupTitle}`);
}

function assertPatchGroupCollapsed(client, groupTitle) {
  return assert.eventually.include(
    findPatchGroup(client, groupTitle).getAttribute('class'),
    'is-closed'
  );
}

function assertPatchGroupExpanded(client, groupTitle) {
  return assert.eventually.include(
    findPatchGroup(client, groupTitle).getAttribute('class'),
    'is-open'
  );
}

function assertNodeAvailableInBrowser(client, nodeName) {
  return assert.eventually.isTrue(
    findProjectBrowser(client).isVisible(`.PatchGroupItem[title=${nodeName}]`)
  );
}

//-----------------------------------------------------------------------------
// Popup dialogs
//-----------------------------------------------------------------------------
function findPopup(client) {
  return client.element('.PopupPrompt');
}

function assertPopupShown(client, title) {
  return Promise.all([
    assert.eventually.isTrue(findPopup(client).isVisible()),
    assert.eventually.strictEqual(findPopup(client).getText('h2'), title),
  ]);
}

function assertNoPopups(client) {
  return assert.eventually.isFalse(findPopup(client).isVisible());
}

function confirmPopup(client) {
  return findPopup(client).click('button.PopupButton-Primary');
}

//-----------------------------------------------------------------------------
// Tabs
//-----------------------------------------------------------------------------
function assertActiveTabHasTitle(client, expectedTitle) {
  return assert.eventually.strictEqual(
    client.getText('.TabsContainer .TabsItem.is-active .tab-name'),
    expectedTitle
  );
}

//-----------------------------------------------------------------------------
// API
//-----------------------------------------------------------------------------

// Public API (in alphabetical order)
const API = {
  assertActiveTabHasTitle,
  assertNoPopups,
  assertNodeAvailableInBrowser,
  assertPatchGroupCollapsed,
  assertPatchGroupExpanded,
  assertPopupShown,
  clickAddPatch,
  confirmPopup,
  findPatchGroup,
  findPopup,
};

/**
 * Creates an object to interact with the page. It would contain all available
 * API methods with `client` already bound.
 */
function createPageObject(client) {
  return R.map(fn => R.partial(fn, [client]))(API);
}

module.exports = {
  createPageObject,
  API,
};
