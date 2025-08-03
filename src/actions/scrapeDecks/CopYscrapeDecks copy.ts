import type { Page } from "puppeteer";
import fs from "fs/promises";
import path from "path";
import logger from "src/logger/logger";

const PATH_TO_INITIAL_SCRAPED_DECK = path.resolve(
  process.cwd(),
  "initial",
  "scrapedDeck.txt"
);

async function _getInitialScrapedDeck() {
  let deckName: string;
  try {
    deckName = await fs.readFile(PATH_TO_INITIAL_SCRAPED_DECK, "utf-8");
    deckName = deckName.trim();
  } catch (err) {
    if (err.code === "ENOENT") {
      logger.warn("Initial scraped deck not found.");
      return null;
    }
    throw err;
  }

  return deckName;
}

export async function scrapeDecks(page: Page) {
  const initialScrapedDeck = await _getInitialScrapedDeck();
  if (!initialScrapedDeck) {
    // do stuff
  }
  const deckButtons = await page.$$('tbody > tr > td:first-child');
  if (deckButtons.length === 0) {
    // ELEMENTS NOT FOUND, DO W/E
  }

  let lastScrapedDeckIndex = -1;
  let i = 0;
  while (i < deckButtons.length) {
    const button = deckButtons[i];
    const deckName = await button.evaluate(el => el.innerText.trim());
    if (deckName === initialScrapedDeck) {
        lastScrapedDeckIndex = i;
        break;
    }
    i++;
  }

  if (lastScrapedDeckIndex === -1) {
    logger.error(`The initial deck "${initialScrapedDeck}" couldn't be found in your deck list.`);
    // RETURN SOME KIND OF FAILURE CODE
    return -1;
  }
  if (lastScrapedDeckIndex)
  deckButtons.findIndex(el => el.)
}
