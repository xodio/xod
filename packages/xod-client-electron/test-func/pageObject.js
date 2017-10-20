
const R = require('ramda');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
const assert = chai.assert;

//-----------------------------------------------------------------------------
// General Utils
//-----------------------------------------------------------------------------
function scrollTo(client, containerSelector, childSelector) {
  return client.execute((contSel, chldSel) => {
    const container = document.querySelector(contSel);
    const child = document.querySelector(chldSel);
    container.scrollTop = child.offsetTop;
  }, containerSelector, childSelector);
}


// -----------------------------------------------------------------------------
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
  return findPopup(client).click('button.Button--primary');
}

function getCodeboxValue(client) {
  return client.getValue('.Codebox');
}

function closePopup(client) {
  return client.element('.skylight-close-button').click();
}

//-----------------------------------------------------------------------------
// Project browser
//-----------------------------------------------------------------------------
const getSelectorForPatchInProjectBrowser = nodeName => `.PatchGroupItem[title=${nodeName}]`;

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
    'is-closed',
    `Expected patch group "${groupTitle}" to be collapsed, but it's expanded`
  );
}

function assertPatchGroupExpanded(client, groupTitle) {
  return assert.eventually.include(
    findPatchGroup(client, groupTitle).getAttribute('class'),
    'is-open',
    `Expected patch group "${groupTitle}" to be expanded, but it's collapsed`
  );
}

function assertNodeAvailableInProjectBrowser(client, nodeName) {
  return assert.eventually.isTrue(
    findProjectBrowser(client).isVisible(getSelectorForPatchInProjectBrowser(nodeName)),
    `Expected node "${nodeName}" to be available in the project browser`
  );
}

function assertNodeUnavailableInProjectBrowser(client, nodeName) {
  return assert.eventually.isFalse(
    findProjectBrowser(client).isVisible(getSelectorForPatchInProjectBrowser(nodeName)),
    `Expected node "${nodeName}" to be unavailable in the project browser`
  );
}

function scrollToPatchInProjectBrowser(client, name) {
  return scrollTo(
    client,
    '.PatchTypeSelector .inner-container',
    getSelectorForPatchInProjectBrowser(name)
  );
}

function selectPatchInProjectBrowser(client, name) {
  return client.click(getSelectorForPatchInProjectBrowser(name));
}

function openPatchFromProjectBrowser(client, name) {
  return client.doubleClick(getSelectorForPatchInProjectBrowser(name));
}

function clickDeletePatchButton(client, name) {
  return client.click(`${getSelectorForPatchInProjectBrowser(name)} span[title="Delete patch"]`);
}

function assertPatchSelected(client, name) {
  return assert.eventually.include(
    client.element(getSelectorForPatchInProjectBrowser(name)).getAttribute('class'),
    'isSelected'
  );
}

function clickAddNodeButton(client, name) {
  return client.element(`${getSelectorForPatchInProjectBrowser(name)} .add-node`).click();
}

//-----------------------------------------------------------------------------
// Patch
//-----------------------------------------------------------------------------
function findNode(client, nodeType) {
  return client.element(`.Node[title=${nodeType}]`);
}

function dragNode(client, nodeType, dx, dy) {
  return client.moveToObject(`.Node[title=${nodeType}]`)
    .buttonDown()
    .moveTo(null, dx, dy)
    .buttonUp()
    .then(() => findNode(client, nodeType)); // for easy chaining
}

function findPin(client, nodeType, pinLabel) {
  return client.element(`.NodePinsOverlay[title=${nodeType}] .PinOverlay[title=${pinLabel}]`);
}

function findLink(client, type) {
  return client.element(`.Link.${type}`);
}

function addNode(client, type, dragX, dragY) {
  return scrollToPatchInProjectBrowser(client, type)
    .then(() => selectPatchInProjectBrowser(client, type))
    .then(() => clickAddNodeButton(client, type))
    .then(() => dragNode(client, type, dragX, dragY));
}

function deletePatch(client, type) {
  return client.waitForVisible(getSelectorForPatchInProjectBrowser(type))
    .then(() => scrollToPatchInProjectBrowser(client, type))
    .then(() => selectPatchInProjectBrowser(client, type))
    .then(() => clickDeletePatchButton(client, type))
    .then(() => findProjectBrowser(client).click('.PopupConfirm button.Button--primary'));
}

function assertPinIsSelected(client, nodeType, pinLabel) {
  return assert.eventually.include(
    findPin(client, nodeType, pinLabel).getAttribute('class'),
    'is-selected'
  );
}

function assertPinIsAcceptingLinks(client, nodeType, pinLabel) {
  return assert.eventually.include(
    findPin(client, nodeType, pinLabel).getAttribute('class'),
    'is-accepting-links'
  );
}

//-----------------------------------------------------------------------------
// Inspector
//-----------------------------------------------------------------------------

function findInspectorWidget(client, name) {
  return client.element(`.Widget[title=${name}] input`);
}

function bindValue(client, nodeType, pinLabel, value) {
  return findNode(client, nodeType).click()
    .then(() =>
      findInspectorWidget(client, pinLabel)
        .setValue(value)
        .keys('Enter')
    );
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

function assertTabWithTitleDoesNotExist(client, expectedTitle) {
  return assert.eventually.isFalse(
    client.isExisting(`.tab-name=${expectedTitle}`)
  );
}

//-----------------------------------------------------------------------------
// API
//-----------------------------------------------------------------------------

// Public API (in alphabetical order)
const API = {
  addNode,
  assertActiveTabHasTitle,
  assertTabWithTitleDoesNotExist,
  assertNoPopups,
  assertNodeAvailableInProjectBrowser,
  assertNodeUnavailableInProjectBrowser,
  assertPatchGroupCollapsed,
  assertPatchGroupExpanded,
  assertPatchSelected,
  assertPinIsAcceptingLinks,
  assertPinIsSelected,
  assertPopupShown,
  bindValue,
  clickAddNodeButton,
  clickAddPatch,
  confirmPopup,
  closePopup,
  dragNode,
  findInspectorWidget,
  findLink,
  findNode,
  findPatchGroup,
  findPin,
  findPopup,
  getCodeboxValue,
  scrollTo,
  scrollToPatchInProjectBrowser,
  selectPatchInProjectBrowser,
  openPatchFromProjectBrowser,
  deletePatch,
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
