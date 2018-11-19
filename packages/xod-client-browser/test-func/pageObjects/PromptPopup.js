import ConfirmationPopup from './ConfirmationPopup';

class PromptPopup extends ConfirmationPopup {
  async typeText(text) {
    const input = await this.elementHandle.$('input');
    await input.type(text);
  }
}

PromptPopup.findOnPage = async page => {
  const elementHandle = await page.$('.PopupPrompt');
  if (!elementHandle) return null;

  return new PromptPopup(page, elementHandle);
};

PromptPopup.waitOnPage = async page => {
  await page.waitFor('.PopupPrompt', { timeout: 2000 });
  return PromptPopup.findOnPage(page);
};

export default PromptPopup;
