import puppeteer from 'puppeteer';
import path from 'path';
import { login, myName } from 'src/actions/login/login';
import logger from 'src/logger/logger';
import { URL_APP_PAGE } from '@config/url';
import { enterApp } from 'src/actions/enterApp/enterApp';
import movieRepository from '@db/movie.repository';
import { scrapeDecks } from 'src/actions/scrapeDecks/scrapeDecks';
import scrapeMovie from 'src/actions/scrapeMovie/scrapeMovie';
// console.log(process.env.TRAVERSE_PASS);
// console.log(path.resolve("." + "/logs"));
// logger.info("info");
// logger.trace("trace");
// logger.fatal("fatal");
// logger.debug("debug");

// const newMovie = await movieRepository.create({
//   hanzi: 'dw',
//   isOneCharacterWord: false,
//   keyword: 'To Clean',
//   pinyin: 'shi',
//   notes: 'This is a testing movie',
// });

const browser = await puppeteer.launch({
  headless: false, // show the browser window
  devtools: true, // auto-open DevTools for each page
  //   slowMo: 250, // wait 250ms between operations,
  userDataDir: './browser-profile',
});
// enter app
const page = await browser.newPage();
try {
  await enterApp(page);
  logger.info('Successfully entered app.');
} catch (err) {
  logger.error(err);
  logger.fatal(`Couldn't enter app. Shutting down.`);
  // SHUTDOWN HERE
}

// try {
//   await scrapeDecks(page, []);
//   logger.info('Finished scraping decks.');
// } catch (err) {
//   logger.error(err);
//   logger.fatal(`Couldn't scrape decks. Shutting down.`);
//   // SHUTDOWN HERE
// }

try {
  await page.goto('https://traverse.link/Mandarin_Blueprint/%E5%88%A9');
  const nextMovie = await scrapeMovie(
    page,
    'example-deck',
    'example-section',
    movieRepository,
  );
  console.log(nextMovie);
} catch (err) {
  console.error(err);
  logger.error(
    { sourceError: err },
    `Failed to scrape movie at https://traverse.link/Mandarin_Blueprint/%E5%88%A9.`,
  );
}

// get all intermediate headers as list of els
// const initialScrapedLevelHeader = read it from file or db; it should store the name not index because the indices could technically change; alternatively; store the "number" part of the level as that's more universal
// let lastScrapedLevelIndex = headers.findIndex(el => el === initialScrapedLevelHeader)
// if (-1) throw or something
// else scrapeLevel(lastScrapedLevelIndex + 1);
//

// navigation will most likely happens as forward-back instead of opening things in new pages
// because of that, the headerEls[] array will have different references and it should
// const browser = await puppeteer.launch();

// how about making it more generic?
// lastScrapedEL for ANY deck
// get lsit of all Els
// findIndex(el => el === lastScrapedEl);
// if (index + 1 === list.length) logger.info('All done, exiting')
// if (-1) logger.error('Provide different initial or w/e. Exiting)
// else scrapeEl(index + 1);
// on successful finish of scrapeEl - lastScrapedEl = textOf index + 1

// another idea would be to maintain a list of scraped decks
// instead of relying on specific ordering, and the fact that new decks aren't
// added BEFORE your last scraped one in hte list, you could just store all the
// scraped ones and compare
// after comparing you're left with an array of elHandles and you scrape from there,
// adding the newly completed ones to that list
console.log(myName);
