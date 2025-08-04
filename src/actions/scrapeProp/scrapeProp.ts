import { type PropCreateInput } from '@generated/prisma/internal/prismaNamespace';
import type { Page } from 'puppeteer';

export default async function scrapeProp(page: Page): Promise<PropCreateInput> {
  await page.waitForSelector(
    'main div.reveal-prompt div.field-name::-p-text(PROP)',
  );

  const noteSection = await page.$('main div.reveal-prompt');
  if (!noteSection) {
    throw new Error('scrapeProp() failed to find noteSection.');
  }

  let component: string, propField: string;
  try {
    component = await noteSection.$eval(
      `::-p-xpath(.//div[contains(concat(' ', normalize-space(@class), ' '), ' ProseMirror ')]/h2[contains(normalize-space(.), 'Pick a prop for')])`,
      (el) =>
        (el as HTMLHeadingElement).innerText
          .replace('Pick a prop for', '')
          .trim(),
    );
  } catch (err) {
    throw new Error(
      `scrapeProp() failed to scrape "component" field. Error: ${err}`,
    );
  }

  try {
    propField = await noteSection.$eval(
      `::-p-xpath(.//div[./div[contains(concat(' ', normalize-space(@class), ' '), ' field-name ') and contains(normalize-space(.), 'PROP')]]/*[contains(concat(' ', normalize-space(@class), ' '), ' field-editor ')]//*[contains(concat(' ', normalize-space(@class), ' '), ' ProseMirror ')])`,
      (el) => (el as HTMLElement).innerText.trim(),
    );
  } catch (err) {
    throw new Error(
      `scrapeProp() failed to scrape "prop" field. Error: ${err}`,
    );
  }

  const prop: PropCreateInput = {
    component,
    prop: propField,
  };

  return prop;
}
