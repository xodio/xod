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

async function waitForExist(client, selector, timeout) {
  const el = await client.$(selector);
  return el.waitForExist({ timeout });
}

function rendered(client) {
  return assert.eventually.isTrue(waitForExist(client, '.Editor', 5000));
}

// -----------------------------------------------------------------------------
// Popup dialogs
//-----------------------------------------------------------------------------
function findPopup(client) {
  return client.$('.PopupPrompt');
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

async function setPopupValue(client, value) {
  const popup = await findPopup(client);
  const input = await popup.$('input');
  return input.setValue(value);
}

async function confirmPopup(client) {
  const popup = await findPopup(client);
  const confirmButton = await popup.$('button.Button--primary');
  return confirmButton.click();
}

function getCodeboxValue(client) {
  return client.getValue('.Codebox');
}

function closePopup(client) {
  return client.$('.skylight-close-button').click();
}

//-----------------------------------------------------------------------------
// Project browser
//-----------------------------------------------------------------------------
const getSelectorForPatchInProjectBrowser = nodeName =>
  `.PatchGroupItem[data-id="${nodeName}"]`;

function findProjectBrowser(client) {
  return client.$('.ProjectBrowser');
}

function assertProjectIsOpened(client, projectName) {
  const selector = `.PatchGroup__trigger.my .patch-group-trigger[data-id="${projectName}"`;
  return assert.eventually.isTrue(waitForExist(client, selector, 15000));
}

async function clickAddPatch(client) {
  const projectBrowser = await findProjectBrowser(client);
  const addPatchButton = await projectBrowser.$('button[title="Add patch"]');
  return addPatchButton.click();
}

async function findPatchGroup(client, groupTitle) {
  const projectBrowser = await findProjectBrowser(client);
  const patchGroup = await projectBrowser.$(`.PatchGroup=${groupTitle}`);
  await patchGroup.waitForExist({ timeout: 5000 });
  return patchGroup;
}

async function findPatchGroupItem(client, name) {
  const projectBrowser = await findProjectBrowser(client);
  const patchGroupItem = await projectBrowser.$(
    getSelectorForPatchInProjectBrowser(name)
  );
  await patchGroupItem.waitForExist({ timeout: 5000 });
  return patchGroupItem;
}

async function assertPatchGroupCollapsed(client, groupTitle) {
  const patchGroup = await findPatchGroup(client, groupTitle);

  return assert.eventually.include(
    patchGroup.getAttribute('class'),
    'is-closed',
    `Expected patch group "${groupTitle}" to be collapsed, but it's expanded`
  );
}

async function assertPatchGroupExpanded(client, groupTitle) {
  const patchGroup = await findPatchGroup(client, groupTitle);

  return assert.eventually.include(
    patchGroup.getAttribute('class'),
    'is-open',
    `Expected patch group "${groupTitle}" to be expanded, but it's collapsed`
  );
}

async function assertNodeAvailableInProjectBrowser(client, nodeName) {
  const projectBrowser = await findProjectBrowser(client);
  const patchInProjectBrowser = await projectBrowser.$(
    getSelectorForPatchInProjectBrowser(nodeName)
  );

  return assert.eventually.isTrue(
    patchInProjectBrowser.isDisplayed(),
    `Expected node "${nodeName}" to be available in the project browser`
  );
}

async function assertNodeUnavailableInProjectBrowser(client, nodeName) {
  const projectBrowser = await findProjectBrowser(client);
  const patchInProjectBrowser = await projectBrowser.$(
    getSelectorForPatchInProjectBrowser(nodeName)
  );

  return assert.eventually.isFalse(
    patchInProjectBrowser.isDisplayed(),
    `Expected node "${nodeName}" to be unavailable in the project browser`
  );
}

function scrollToPatchInProjectBrowser(client, name) {
  return scrollTo(
    client,
    '.ProjectBrowser .inner-container',
    getSelectorForPatchInProjectBrowser(name)
  );
}

async function selectPatchInProjectBrowser(client, name) {
  const patch = await findPatchGroupItem(client, name);
  const selected = await hasClass('isSelected', patch);

  return selected ? Promise.resolve() : patch.click();
}

async function openProjectBrowserPatchContextMenu(client, name) {
  await selectPatchInProjectBrowser(client, name);

  const selector = getSelectorForPatchInProjectBrowser(name);
  const contextMenuIcon = await client.$(`${selector} .contextmenu`);
  await contextMenuIcon.waitForExist({ timeout: 5000 });

  return contextMenuIcon.click({ button: 'right' });
}

function findProjectBrowserPatchContextMenu(client) {
  return client.$('.ContextMenu--PatchGroupItem');
}

async function openPatchFromProjectBrowser(client, name) {
  const patchInProjectBrowser = await client.$(
    getSelectorForPatchInProjectBrowser(name)
  );

  return patchInProjectBrowser.doubleClick();
}

async function clickDeletePatchButton(client, name) {
  await openProjectBrowserPatchContextMenu(client, name);

  const contextMenu = await findProjectBrowserPatchContextMenu(client);
  const contextMenuItem = await contextMenu.$(
    '.react-contextmenu-item[data-id="delete"]'
  );

  return contextMenuItem.click();
}

function assertPatchSelected(client, name) {
  return assert.eventually.include(
    client
      .$(getSelectorForPatchInProjectBrowser(name))
      .then(el => el.getAttribute('class')),
    'isSelected'
  );
}

async function clickAddNodeButton(client, name) {
  await openProjectBrowserPatchContextMenu(client, name);

  const contextMenu = await findProjectBrowserPatchContextMenu(client);
  const placeMenuItem = await contextMenu.$(
    '.react-contextmenu-item[data-id="place"]'
  );

  return placeMenuItem.click();
}

async function expandPatchGroup(client, groupTitle) {
  const patchGroup = await findPatchGroup(client, groupTitle);
  const classList = await patchGroup.getAttribute('class');
  const isOpen = R.contains('is-open', classList);

  return isOpen ? Promise.resolve() : patchGroup.click();
}

//-----------------------------------------------------------------------------
// LibSuggester
//-----------------------------------------------------------------------------
function findLibSuggester(client) {
  return client.$('.Suggester-libs');
}

async function assertLibSuggesterShown(client) {
  const libSuggester = await findLibSuggester(client);
  return assert.eventually.isTrue(libSuggester.isDisplayed());
}

async function assertLibsNotFound(client) {
  const libSuggester = await findLibSuggester(client);
  const errorMessage = await libSuggester.$('.error');
  return assert.eventually.isTrue(
    errorMessage.waitForExist({ timeout: 30000 })
  );
}

async function assertLibraryFound(client) {
  const libSuggester = await findLibSuggester(client);
  const foundLibrary = await libSuggester.$('.Suggester-item--library');
  return assert.eventually.isTrue(
    foundLibrary.waitForExist({ timeout: 30000 })
  );
}

function installLibrary(client) {
  return findLibSuggester(client).then(el =>
    el.doubleClick('.Suggester-item--library')
  );
}

async function assertLibSuggesterHidden(client) {
  const libSuggester = await findLibSuggester(client);
  return assert.eventually.isFalse(libSuggester.isExisting());
}

function assertProjectBrowserHasInstallingLib(client, libName) {
  const selector = '.PatchGroup--installing';
  return assert.eventually.equal(
    client
      .$(selector)
      .then(el => el.waitForExist({ timeout: 10000 }).then(() => el.$('.name')))
      .then(el => el.getText()),
    libName
  );
}

//-----------------------------------------------------------------------------
// Patch
//-----------------------------------------------------------------------------
function findNode(client, nodeType) {
  return client.$(`.Node[data-label="${nodeType}"]`);
}

async function isNodeVisible(client, nodeType) {
  const node = await client.$(`.Node[data-label="${nodeType}"]`);
  return node.isDisplayed();
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
  return client.$(
    `.NodePinsOverlay[data-label="${nodeType}"] .PinOverlay[data-label="${pinLabel}"]`
  );
}

function findLink(client, type) {
  return client.$(`.Link.${type}`);
}

function addNode(client, type, dragX, dragY) {
  return scrollToPatchInProjectBrowser(client, type)
    .then(() => selectPatchInProjectBrowser(client, type))
    .then(() => clickAddNodeButton(client, type))
    .then(() => dragNode(client, type, dragX, dragY));
}

async function deletePatch(client, type) {
  // client.waitForVisible(getSelectorForPatchInProjectBrowser(type))

  await scrollToPatchInProjectBrowser(client, type);
  await clickDeletePatchButton(client, type);
  const projectBrowser = await findProjectBrowser(client);
  // TODO: why exactly do we search for in inside project browser?
  const popupConfirmButton = await projectBrowser.$(
    '.PopupConfirm button.Button--primary'
  );

  return popupConfirmButton.click();
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
  return client.$(`.Widget[title=${name}] input`);
}

async function bindValue(client, nodeType, pinLabel, value) {
  const node = await findNode(client, nodeType);
  await node.click();

  const inspectorWidget = await findInspectorWidget(client, pinLabel);
  await inspectorWidget.setValue(value);
  return inspectorWidget.keys('Enter');
}

//-----------------------------------------------------------------------------
// Tabs
//-----------------------------------------------------------------------------
async function assertActiveTabHasTitle(client, expectedTitle) {
  const tab = await client.$('.TabsContainer .TabsItem.is-active .tab-name');
  return assert.eventually.strictEqual(tab.getText(), expectedTitle);
}

function assertTabWithTitleDoesNotExist(client, expectedTitle) {
  return assert.eventually.isFalse(
    client.isExisting(`.tab-name=${expectedTitle}`)
  );
}

async function assertNoPatchesAreOpen(client) {
  const el = await client.$('.NoPatch');
  return assert.eventually.isTrue(el.isDisplayed());
}

//-----------------------------------------------------------------------------
// Messages
//-----------------------------------------------------------------------------
function waitUntilProjectSaved(client) {
  return waitForExist(client, '.SnackBarMessage*=Saved', 5000);
}
function waitUntilLibraryInstalled(client) {
  return waitForExist(client, '.SnackBarMessage*=Installed', 10000);
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
  isNodeVisible,
  findPatchGroup,
  findPatchGroupItem,
  findPin,
  findPopup,
  setPopupValue,
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
