import type { ElementHandle, Page } from 'puppeteer';
import logger from 'src/logger/logger';

async function _getSectionHandles(page: Page, deckName: string) {
  const parentContainer = await page.$(
    `div:not([class]):has(> ::-p-text(${deckName}))`,
  );
  if (!parentContainer) {
    logger.error("_getSectionHandles() couldn't find parentContainer.");
    throw new Error("Couldn't find parentContainer.");
  }
  const sectionHandles = await parentContainer.$$(
    ':scope > div:not(:first-child)',
  );

  return sectionHandles;
}

export async function scrapeCurrentDeck(page: Page, deckName: string) {
  const parentContainer = await page.$(
    `div:not([class]):has(> ::-p-text(${deckName}))`,
  );
  if (!parentContainer) {
    // do stuff
    return;
  }
  const sectionHandles = await parentContainer.$$(
    ':scope > *:not(:first-child)',
  );
  const sectionNames: string[] = [];
  for (let i = 0; i < sectionHandles.length; i++) {
    const currentHandle = sectionHandles[i];
    const sectionName = await currentHandle.evaluate((el) => {
      if (el instanceof HTMLElement) {
        return el.innerText;
      }
      return null;
    });
    if (!sectionName) continue;

    sectionNames.push(sectionName);
  }

  for (let i = 0; i < sectionNames.length; i++) {
    const initialUrl = page.url();
    const currentSection = sectionNames[i];

    const sections = await _getSectionHandles(page, deckName);
    let currentSectionHandle: ElementHandle<HTMLElement> | null = null;
    let j = 0;
    while (j < sections.length) {
      let innerText: string;
      try {
        innerText = await sections[j].evaluate((el) => el.innerText);
      } catch {
        break;
      }
      if (innerText === currentSection) {
        currentSectionHandle = sections[j];
        break;
      }
      j++;
    }

    if (!currentSectionHandle) {
      logger.error(
        `Section "${currentSection}" not found under "${deckName}" deck.`,
      );
      continue;
    }

    try {
      await Promise.all([
        page.waitForNavigation(),
        currentSectionHandle.click(),
      ]);
    } catch (err) {
      logger.error(
        `Couldn't navigate to "${currentSection}" section (${deckName} -> ${currentSection}). Error: ${err}`,
      );

      // navigate back to deck page
      const res = await page.goto(initialUrl, { waitUntil: 'networkidle2' });
      if (res && res?.ok()) {
        continue;
      } else {
        logger.error(`Couldn't navigate back to ${initialUrl}.`);
        throw new Error(`Couldn't navigate back to ${initialUrl}.`);
      }
    }

    scrapeSection(page, deckName, currentSection);
    // consider persisting sections scraped to db in format: "deckName -> sectionName"

    // navigate back to deck page
    const res = await page.goto(initialUrl, { waitUntil: 'networkidle2' });
    if (res && res?.ok()) {
      continue;
    } else {
      logger.error(`Couldn't navigate back to ${initialUrl}.`);
      throw new Error(`Couldn't navigate back to ${initialUrl}.`);
    }
  }
  // const sectionHandles = await page.$$('div:not([class]) > *:not(:first-child)')
  // get sections
  //  parse section names
  //

  logger.warn(
    `Encountered unknown section type "sectionName" at currentDeck -> sectionName (sectionUrl).`,
  );
}
