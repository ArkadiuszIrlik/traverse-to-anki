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

async function _getParentContainer(page: Page, deckName: string) {
  await page.waitForSelector(
    `::-p-xpath(//div[contains(concat(' ', normalize-space(@class), ' '), ' map-with-sidebar ')]//div[not(@class) and (./*[1][contains(normalize-space(.), "${deckName}")])])`,
  );

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

async function _navigateToSectionPage(page: Page, sectionName: string) {
  const sectionButtonSelector = `::-p-xpath(//main//div[not(@class)]/div[contains(normalize-space(.), '${sectionName}')])`;

  try {
    await page.waitForSelector(sectionButtonSelector);
    await page.click(sectionButtonSelector);
  } catch (err) {
    logger.error(`Couldn't open section: ${sectionName}.`);
    throw new Error(`Couldn't open section: ${sectionName}.`);
  }
}

export async function scrapeCurrentDeck(page: Page, deckName: string) {
  // const parentContainer = await page.$(
  //   `div:not([class]):has(> ::-p-text(${deckName}))`,
  // );
  // const parentContainer = await page.$(
  //   `::-p-xpath(//div[not(@class) and count(./*) > 0 and (./*[1][text() = '${deckName}'])])`,
  // );
  const currentDeckUrl = page.url();
  console.log(
    `scrapeCurrentDeck() enters, scraping deck name: '${deckName}', url: ${currentDeckUrl}`,
  );
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

  // get sectionNames from sectionHandles
  const sectionNames: string[] = [];
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

  // scrape every section
  for (let i = 0; i < sectionNames.length; i++) {
    console.log('scrapeCurrentDeck');
    const currentSectionName = sectionNames[i];
    // needs a new handle on every loop
    const parentContainer = await _getParentContainer(page, deckName);
    if (!parentContainer) {
      logger.warn("scrapeCurrentDeck couldn't find parentContainer.");
      return;
    }

    const sectionHandles = await parentContainer.$$(
      ':scope > div:not(:first-child)',
    );

    // get handle matching currentSectionName
    let currentSectionHandle: ElementHandle<HTMLElement> | null = null;
    let j = 0;
    while (j < sectionHandles.length) {
      let innerText: string;
      try {
        innerText = await sectionHandles[j].evaluate((el) => el.innerText);
      } catch {
        break;
      }
      if (innerText === currentSectionName) {
        currentSectionHandle = sectionHandles[j];
        break;
      }
      j++;
    }

    if (!currentSectionHandle) {
      logger.error(
        `Section "${currentSectionName}" not found under "${deckName}" deck.`,
      );
      continue;
    }

    // navigate to currentSectionHandle
    try {
      await currentSectionHandle.click();
      // makes sure last-seen lesson isn't selected
      await _navigateToSectionPage(page, currentSectionName);
    } catch (err) {
      logger.error(
        `Couldn't navigate to "${currentSectionName}" section (${deckName} -> ${currentSectionName}). Error: ${err}`,
      );

      // navigate back to deck page
      const res = await page.goto(currentDeckUrl, {
        waitUntil: 'networkidle2',
      });
      console.log(
        'supposedly, scrapeCurrentDeck navigated to ' + currentDeckUrl,
      );
      console.log('actual current url is ' + page.url());
      if (res && res?.ok()) {
        continue;
      } else {
        logger.error(`Couldn't navigate back to ${currentDeckUrl}.`);
        throw new Error(`Couldn't navigate back to ${currentDeckUrl}.`);
      }
    }

    console.log('calling scrapeSection');
    await page.screenshot({
      path: `./screenshots/scrapeSection-${new Date().toTimeString()}.jpeg`,
    });
    await scrapeSection(page, deckName, currentSectionName);
    // consider persisting sections scraped to db in format: "deckName -> sectionName"

    // navigate back to deck page
    // const res = await page.goto(currentDeckUrl, { waitUntil: 'networkidle2' });

    // if (res && res?.ok()) {
    //   continue;
    // } else {
    //   logger.error(`Couldn't navigate back to ${currentDeckUrl}.`);
    //   throw new Error(`Couldn't navigate back to ${currentDeckUrl}.`);
    // }
    await _navigateToCurrentDeckView(page, deckName);
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

async function _navigateToCurrentDeckView(page: Page, deckName: string) {
  const deckButtonSelector = `::-p-xpath(//main//div[not(@class)]/div[contains(normalize-space(.), '${deckName}')])`;

  try {
    await page.waitForSelector(deckButtonSelector);
    await page.click(deckButtonSelector);
  } catch (err) {
    logger.error(`Couldn't open deck: ${deckName}.`);
    throw new Error(`Couldn't open deck: ${deckName}.`);
  }
}
