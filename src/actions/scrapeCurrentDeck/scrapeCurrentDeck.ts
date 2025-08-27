import type { ElementHandle, Page } from 'puppeteer';
import scrapeSection from 'src/actions/scrapeSection/scrapeSection';
import logger from 'src/logger/logger';

// async function _getSectionHandles(page: Page, deckName: string) {
//   const parentContainer = await page.$(
//     `div:not([class]):has(> ::-p-text(${deckName}))`,
//   );
//   if (!parentContainer) {
//     logger.error("_getSectionHandles() couldn't find parentContainer.");
//     throw new Error("Couldn't find parentContainer.");
//   }
//   const sectionHandles = await parentContainer.$$(
//     ':scope > div:not(:first-child)',
//   );

//   return sectionHandles;
// }

function _getParentContainer(page: Page, deckName: string) {
  return page.$(
    `::-p-xpath(//div[contains(concat(' ', normalize-space(@class), ' '), ' map-with-sidebar ')]//div[not(@class) and (./*[1][contains(normalize-space(.), "${deckName}")])])`,
  );
}

async function _getSectionHandles(parentContainer: ElementHandle<Element>) {
  const sectionHandles = await parentContainer.$$(
    ':scope > div:not(:first-child)',
  );

  return sectionHandles;
}

export async function scrapeCurrentDeck(page: Page, deckName: string) {
  // const parentContainer = await page.$(
  //   `div:not([class]):has(> ::-p-text(${deckName}))`,
  // );
  // const parentContainer = await page.$(
  //   `::-p-xpath(//div[not(@class) and count(./*) > 0 and (./*[1][text() = '${deckName}'])])`,
  // );
  console.log(deckName);
  const parentContainer = await _getParentContainer(page, deckName);
  if (!parentContainer) {
    console.log('didnt find jack');
    // do stuff
    return;
  }
  console.log('scrapeCurrentDeck got this far');
  parentContainer.evaluate((el) => console.log(el));
  const sectionHandles = await parentContainer.$$(
    ':scope > *:not(:first-child)',
  );
  const sectionNames: string[] = [];
  console.log('any sectionNames in chat?');
  console.log(sectionHandles);
  for (let i = 0; i < sectionHandles.length; i++) {
    console.log('loop A executes ' + i);
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
    console.log('loop B executes ' + i);

    const initialUrl = page.url();
    const currentSection = sectionNames[i];
    const parentContainer = await _getParentContainer(page, deckName);
    if (!parentContainer) {
      logger.warn("scrapeCurrentDeck couldn't find parentContainer.");
      return;
    }

    // const sections = await _getSectionHandles(page, deckName);
    console.log('Should attempt below and I guess, fail');
    const sections = await parentContainer.$$(':scope > div:not(:first-child)');
    console.log('is this the problem?');
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
      console.log('DONE AWAITING => LOADED');
      console.log('clicked and now what?');
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

    console.log('calling scrapeSection');
    await scrapeSection(page, deckName, currentSection);
    // consider persisting sections scraped to db in format: "deckName -> sectionName"

    // navigate back to deck page
    console.log('moves on from scrapeSection');
    const res = await page.goto(initialUrl, { waitUntil: 'networkidle2' });
    console.log('navigates back to initialUrl');

    if (res && res?.ok()) {
      console.log('res was ok');
      continue;
    } else {
      console.log('res was not ok apparently');
      logger.error(`Couldn't navigate back to ${initialUrl}.`);
      throw new Error(`Couldn't navigate back to ${initialUrl}.`);
    }
  }
  // const sectionHandles = await page.$$('div:not([class]) > *:not(:first-child)')
  // get sections
  //  parse section names
  //

  // The one below is a leftoever of some kind I think, not sure what this was doing here.
  // logger.warn(
  //   `Encountered unknown section type "sectionName" at currentDeck -> sectionName (sectionUrl).`,
  // );
}
