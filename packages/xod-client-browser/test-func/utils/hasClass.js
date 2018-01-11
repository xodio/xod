export default async function hasClass(page, elementHandle, className) {
  const classList = await page.evaluate(
    el => Array.from(el.classList),
    elementHandle
  );

  return classList.includes(className);
}
