const R = require('ramda');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
const { assert } = chai;

//-----------------------------------------------------------------------------
// Func utils
//-----------------------------------------------------------------------------
const hasClass = R.curry((className, element) =>
  R.composeP(R.contains(className), R.split(' '), el =>
    el.getAttribute('class')
  )(element)
);

//-----------------------------------------------------------------------------
// General Utils
//-----------------------------------------------------------------------------
function scrollTo(client, containerSelector, childSelector) {
  return client.execute(
    (contSel, chldSel) => {
      const container = document.querySelector(contSel);
      const child = document.querySelector(chldSel);
      container.scrollTop = child.offsetTop;
    },
    containerSelector,
    childSelector
  );
}

function rendered(client) {
  return assert.eventually.isTrue(client.waitForExist('.Editor', 5000));
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
const getSelectorForPatchInProjectBrowser = nodeName =>
  `.PatchGroupItem[data-id="${nodeName}"]`;

function findProjectBrowser(client) {
  return client.element('.ProjectBrowser');
}

function assertProjectIsOpened(client, projectName) {
  const selector = `.PatchGroup__trigger.my .patch-group-trigger[data-id="${projectName}"`;
  return assert.eventually.isTrue(client.waitForExist(selector, 5000));
}

function clickAddPatch(client) {
  return findProjectBrowser(client).click('button[title="Add patch"]');
}

function findPatchGroup(client, groupTitle) {
  const selector = `.PatchGroup=${groupTitle}`;
  return findProjectBrowser(client)
    .waitForExist(selector, 5000)
    .then(() => client.element(selector));
}

function findPatchGroupItem(client, name) {
  const selector = getSelectorForPatchInProjectBrowser(name);
  return findProjectBrowser(client)
    .waitForExist(selector, 5000)
    .then(() => client.element(selector));
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
    findProjectBrowser(client).isVisible(
      getSelectorForPatchInProjectBrowser(nodeName)
    ),
    `Expected node "${nodeName}" to be available in the project browser`
  );
}

function assertNodeUnavailableInProjectBrowser(client, nodeName) {
  return assert.eventually.isFalse(
    findProjectBrowser(client).isVisible(
      getSelectorForPatchInProjectBrowser(nodeName)
    ),
    `Expected node "${nodeName}" to be unavailable in the project browser`
  );
}

function scrollToPatchInProjectBrowser(client, name) {
  return scrollTo(
    client,
    '.ProjectBrowser',
    getSelectorForPatchInProjectBrowser(name)
  );
}

function selectPatchInProjectBrowser(client, name) {
  const patch = findPatchGroupItem(client, name);
  return hasClass('isSelected', patch).then(
    selected =>
      selected
        ? Promise.resolve()
        : client.click(getSelectorForPatchInProjectBrowser(name))
  );
}

function openProjectBrowserPatchContextMenu(client, name) {
  const selector = getSelectorForPatchInProjectBrowser(name);

  return selectPatchInProjectBrowser(client, name)
    .then(() => client.waitForVisible(`${selector} .contextmenu`))
    .then(() => findPatchGroupItem(client, name).rightClick('.contextmenu'));
}

function findProjectBrowserPatchContextMenu(client) {
  return client.element('.ContextMenu--PatchGroupItem');
}

function openPatchFromProjectBrowser(client, name) {
  return client.doubleClick(getSelectorForPatchInProjectBrowser(name));
}

function clickDeletePatchButton(client, name) {
  return openProjectBrowserPatchContextMenu(client, name).then(() =>
    findProjectBrowserPatchContextMenu(client).click(
      '.react-contextmenu-item[data-id="delete"]'
    )
  );
}

function assertPatchSelected(client, name) {
  return assert.eventually.include(
    client
      .element(getSelectorForPatchInProjectBrowser(name))
      .getAttribute('class'),
    'isSelected'
  );
}

function clickAddNodeButton(client, name) {
  return openProjectBrowserPatchContextMenu(client, name).then(() =>
    findProjectBrowserPatchContextMenu(client).click(
      '.react-contextmenu-item[data-id="place"]'
    )
  );
}

function expandPatchGroup(client, groupTitle) {
  return hasClass('is-open', findPatchGroup(client, groupTitle)).then(
    opened =>
      opened ? Promise.resolve() : findPatchGroup(client, groupTitle).click()
  );
}

//-----------------------------------------------------------------------------
// LibSuggester
//-----------------------------------------------------------------------------
function findLibSuggester(client) {
  return client.element('.Suggester-libs');
}

function assertLibSuggesterShown(client) {
  return assert.eventually.isTrue(findLibSuggester(client).isVisible());
}

function assertLibsNotFound(client) {
  return assert.eventually.isTrue(
    findLibSuggester(client).waitForExist('.error', 10000)
  );
}

function assertLibraryFound(client) {
  return assert.eventually.isTrue(
    findLibSuggester(client).waitForExist('.Suggester-item--library', 10000)
  );
}

function installLibrary(client) {
  return findLibSuggester(client).doubleClick('.Suggester-item--library');
}

function assertLibSuggesterHidden(client) {
  return assert.eventually.isFalse(client.isExisting('.Suggester-libs'));
}

function assertProjectBrowserHasInstallingLib(client, libName) {
  const selector = '.PatchGroup--installing';
  return assert.eventually.equal(
    client
      .waitForExist(selector, 10000)
      .then(() => client.element('.PatchGroup--installing').getText('.name')),
    libName
  );
}

//-----------------------------------------------------------------------------
// Patch
//-----------------------------------------------------------------------------
function findNode(client, nodeType) {
  return client.element(`.Node[data-label="${nodeType}"]`);
}

function dragNode(client, nodeType, dx, dy) {
  return client
    .moveToObject(`.Node[data-label="${nodeType}"]`)
    .buttonDown()
    .moveTo(null, dx, dy)
    .buttonUp()
    .then(() => findNode(client, nodeType)); // for easy chaining
}

function findPin(client, nodeType, pinLabel) {
  return client.element(
    `.NodePinsOverlay[data-label="${nodeType}"] .PinOverlay[data-label="${pinLabel}"]`
  );
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
  return client
    .waitForVisible(getSelectorForPatchInProjectBrowser(type))
    .then(() => scrollToPatchInProjectBrowser(client, type))
    .then(() => clickDeletePatchButton(client, type))
    .then(() =>
      findProjectBrowser(client).click('.PopupConfirm button.Button--primary')
    );
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
  return findNode(client, nodeType)
    .click()
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

function assertNoPatchesAreOpen(client) {
  return assert.eventually.isTrue(client.isVisible('.NoPatch'));
}

//-----------------------------------------------------------------------------
// Messages
//-----------------------------------------------------------------------------
function waitUntilProjectSaved(client) {
  return client.waitForExist('.SnackBarMessage*=Saved', 5000);
}
function waitUntilLibraryInstalled(client) {
  return client.waitForExist('.SnackBarMessage*=installed', 10000);
}

//-----------------------------------------------------------------------------
// API
//-----------------------------------------------------------------------------

// Public API (in alphabetical order)
const API = {
  rendered,
  addNode,
  assertActiveTabHasTitle,
  assertTabWithTitleDoesNotExist,
  assertNoPatchesAreOpen,
  assertNoPopups,
  assertNodeAvailableInProjectBrowser,
  assertNodeUnavailableInProjectBrowser,
  assertPatchGroupCollapsed,
  assertPatchGroupExpanded,
  assertPatchSelected,
  assertPinIsAcceptingLinks,
  assertPinIsSelected,
  assertPopupShown,
  assertProjectIsOpened,
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
  findPatchGroupItem,
  findPin,
  findPopup,
  getCodeboxValue,
  scrollTo,
  scrollToPatchInProjectBrowser,
  selectPatchInProjectBrowser,
  openPatchFromProjectBrowser,
  openProjectBrowserPatchContextMenu,
  deletePatch,
  expandPatchGroup,
  // LibSuggester
  findLibSuggester,
  assertLibSuggesterShown,
  assertLibsNotFound,
  assertLibraryFound,
  installLibrary,
  assertLibSuggesterHidden,
  assertProjectBrowserHasInstallingLib,
  // Messages
  waitUntilProjectSaved,
  waitUntilLibraryInstalled,
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
