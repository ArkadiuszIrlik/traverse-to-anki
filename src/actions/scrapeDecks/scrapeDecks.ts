import type { ElementHandle, Page } from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import logger from 'src/logger/logger';
import type { IScrapedDeckRepository } from '@db/scrapedDeck.repository';
import { scrapeCurrentDeck } from 'src/actions/scrapeCurrentDeck/scrapeCurrentDeck';

const PATH_TO_INITIAL_SCRAPED_DECK = path.resolve(
  process.cwd(),
  'initial',
  'scrapedDeck.txt',
);

async function _getInitialScrapedDeck() {
  let deckName: string;
  try {
    deckName = await fs.readFile(PATH_TO_INITIAL_SCRAPED_DECK, 'utf-8');
    deckName = deckName.trim();
  } catch (err) {
    if (err.code === 'ENOENT') {
      logger.warn('Initial scraped deck not found.');
      return null;
    }
    throw err;
  }

  return deckName;
}

/** Scrapes decks from the main app page
 *
 * @param page Puppeteer page object for the app's main page
 * @param scrapedDecks list of names of already scraped decks
 * @param deckNameMatcher optional matcher that determines if a deck should be scraped
 * @returns
 */
export async function scrapeDecks(
  page: Page,
  scrapedDeckRepository: IScrapedDeckRepository,
  scrapedDecks: string[],
  deckNameMatcher?: (name: string) => boolean,
) {
  /*
  const currentScrapedDecks = [...scrapedDecks];

  // const allDecks = getdecks();
  // const decksToScrape = [];

  const initialScrapedDeck = await _getInitialScrapedDeck();
  if (!initialScrapedDeck) {
    // do stuff
  }
  */

  let deckButtons: ElementHandle<HTMLElement>[] = [];
  try {
    // maybe refactor this to be more specific. Use xpath to look for "Flashcards" inside the thead.
    await page.waitForSelector('tbody > tr > td:first-child');
    deckButtons = await page.$$('tbody > tr > td:first-child');
  } catch (err) {
    logger.warn('scrapeDecks() found 0 available decks.');
  }
  // const deckButtons = await page.$$('tbody > tr > td:first-child');
  // if (deckButtons.length === 0) {
  //   // ELEMENTS NOT FOUND, DO W/E
  //   console.log('scrapeDecks found 0 available decks');
  // }

  const allDecks: string[] = [];
  let i = 0;
  while (i < deckButtons.length) {
    const button = deckButtons[i];
    // probably don't trim text here
    const deckName = await button.evaluate((el) => el.innerText);
    allDecks.push(deckName);
    i++;
  }

  const deckNamesToScrape = allDecks.filter((deckName) => {
    if (scrapedDecks.includes(deckName)) return false;
    if (deckNameMatcher) {
      return deckNameMatcher(deckName);
    }
    return true;
  });

  logger.info(`Found ${deckNamesToScrape.length} decks to scrape.`);

  // you can test if the original deck handles exist after navigating back
  // and can still be accessed in the DOM. It would be a small perf optimization.
  // I doubt it though.
  for (let i = 0; i < deckNamesToScrape.length; i++) {
    const currentDeckName = deckNamesToScrape[i];
    const currentDeckButton = await page.$(
      `tbody > tr > td:first-child::-p-text(${currentDeckName})`,
    );
    if (!currentDeckButton) {
      logger.error(`${currentDeckName} not found in the available decks.`);
      continue;
    }

    // navigate to current deck
    try {
      // navigates to last-seen lesson
      // waitForNavigation() likely problematic with client-side routing
      // await Promise.all([page.waitForNavigation(), currentDeckButton.click()]);
      await currentDeckButton.click();
      // navigates to actual current deck page
      await page.waitForSelector(
        `::-p-xpath(//main//div[not(@class)]/div[contains(normalize-space(.), '${currentDeckName}')])`,
      );
      await page.click(
        `::-p-xpath(//main//div[not(@class)]/div[contains(normalize-space(.), '${currentDeckName}')])`,
      );
      console.log(
        `scrapeDecks navigated to currentDeckButton and the current url is ` +
          page.url(),
      );
    } catch (err) {
      logger.error(
        `Couldn't navigate to ${currentDeckName} deck. Error: ${err}`,
      );

      // navigate back to main app
      // const res = await page.goto(initialUrl, { waitUntil: 'networkidle2' });
      // if (res && res?.ok()) {
      //   continue;
      // } else {
      //   logger.error(`Couldn't navigate back to ${initialUrl}.`);
      //   throw new Error(`Couldn't navigate back to ${initialUrl}.`);
      // }
      await _navigateToAppPage(page);
    }

    // call scrapeOneDeck() at current location;
    await scrapeCurrentDeck(page, currentDeckName);
    // if successful, add deck name to scrapedDecks repo
    scrapedDeckRepository
      .create({ name: currentDeckName })
      .then(() => logger.trace(`Added ${currentDeckName} to ScrapedDecks DB.`))
      .catch(() =>
        logger.warn(`Failed to add ${currentDeckName} to ScrapedDecks DB.`),
      );

    // navigate back to main app
    // const res = await page.goto(initialUrl, { waitUntil: 'networkidle2' });
    // if (res && res?.ok()) {
    //   continue;
    // } else {
    //   logger.error(`Couldn't navigate back to ${initialUrl}.`);
    //   throw new Error(`Couldn't navigate back to ${initialUrl}.`);
    // }
    await _navigateToAppPage(page);
  }
  /*
  let lastScrapedDeckIndex = -1;
  // let i = 0;
  while (i < deckButtons.length) {
    const button = deckButtons[i];
    const deckName = await button.evaluate((el) => el.innerText.trim());
    if (deckName === initialScrapedDeck) {
      lastScrapedDeckIndex = i;
      break;
    }
    i++;
  }

  if (lastScrapedDeckIndex === -1) {
    logger.error(
      `The initial deck "${initialScrapedDeck}" couldn't be found in your deck list.`,
    );
    // RETURN SOME KIND OF FAILURE CODE
    return -1;
  }
  */
  // if (lastScrapedDeckIndex)
  // deckButtons.findIndex(el => el.)
}

async function _navigateToAppPage(page: Page) {
  const appButtonSelector = `::-p-xpath(//header//button[contains(concat(' ', normalize-space(@class), ' '), ' logo-container ')])`;

  try {
    await page.waitForSelector(appButtonSelector);
    await page.click(appButtonSelector);
  } catch (err) {
    logger.error(`Couldn't open main app page.`);
    throw new Error(`Couldn't open main app page.`);
  }
}
