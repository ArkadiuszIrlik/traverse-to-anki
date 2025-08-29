import type {
  MovieAudioCreateInput,
  MovieCreateInput,
} from '@generated/prisma/models';
import { delay } from '@utils/async';
import { getFilenameFromURL } from '@utils/string';
import type { Page } from 'puppeteer';

export default async function scrapeMovie(
  page: Page,
): Promise<MovieCreateInput> {
  console.log('scrapeMovie(): ' + page.url());
  // The one below doesnt complete in time when scrapeMovie is invoked directly on app start
  // await page.waitForNavigation({ waitUntil: 'networkidle2' });
  // await page.screenshot({
  //   path: `./screenshots/${new Date().getTime()}.jpeg`,
  // });

  // await delay(5000);

  //RESTORE THIS
  await page.waitForSelector(
    //   // 'main div.reveal-prompt div.field-name::-p-text(NOTES)',
    `::-p-xpath(//main//div[contains(concat(' ', normalize-space(@class), ' '), ' reveal-prompt ')]//div[contains(concat(' ', normalize-space(@class), ' '), ' field-name ') and contains(normalize-space(.), 'NOTES')])`,
  );

  // await page.waitForSelector(
  //   'main div.reveal-prompt div.field-name::-p-text(NOTES)',
  //   // `::-p-xpath(//main)`,
  // );

  const noteSection = await page.$('main div.reveal-prompt');
  if (!noteSection) {
    // logger.error(`scrapeMovie() failed to find noteSection.`);
    throw new Error('scrapeMovie() failed to find noteSection.');
  }

  let character: string,
    keyword: string,
    pinyin: string,
    notes: string,
    audio: MovieAudioCreateInput[],
    isOneCharacterWord: boolean;
  try {
    character = await noteSection.$eval(
      `::-p-xpath(.//div[contains(concat(' ', normalize-space(@class), ' '), ' ProseMirror ')]/h2[contains(normalize-space(.), 'Movie review')])`,
      (el) =>
        (el as HTMLHeadingElement).innerText
          .replace('Movie review:', '')
          .trim(),
    );
  } catch (err) {
    // logger.error(
    //   `scrapeMovie() failed to scrape "character" field. Error: ${err}`,
    // );
    throw new Error(
      `scrapeMovie() failed to scrape "character" field. Error: ${err}`,
    );
  }

  try {
    keyword = await noteSection.$eval(
      `::-p-xpath(.//div[contains(concat(' ', normalize-space(@class), ' '), ' ProseMirror ')]/p[contains(normalize-space(.), "Keyword")]/following-sibling::*[1])`,
      (el) => (el as HTMLElement).innerText.trim(),
    );
  } catch (err) {
    // logger.error(
    //   `scrapeMovie() failed to scrape "keyword" field. Error: ${err}`,
    // );
    throw new Error(
      `scrapeMovie() failed to scrape "keyword" field. Error: ${err}`,
    );
  }

  try {
    pinyin = await noteSection.$eval(
      `::-p-xpath(.//div[contains(concat(' ', normalize-space(@class), ' '), ' ProseMirror ')]/p[contains(normalize-space(.), 'Pinyin')]/following-sibling::*[1])`,
      (el) => (el as HTMLElement).innerText.trim(),
    );
  } catch (err) {
    // logger.error(
    //   `scrapeMovie() failed to scrape "pinyin" field. Error: ${err}`,
    // );
    throw new Error(
      `scrapeMovie() failed to scrape "pinyin" field. Error: ${err}`,
    );
  }

  try {
    const audioSources = await noteSection.$$eval(
      'div.ProseMirror audio',
      (els) => (els as HTMLAudioElement[]).map((el) => el.currentSrc),
    );
    audio = audioSources.map((src) => ({
      sourceUrl: src,
      filename: getFilenameFromURL(src),
    }));
  } catch (err) {
    // logger.error(`scrapeMovie() failed to scrape "audio" field. Error: ${err}`);
    throw new Error(
      `scrapeMovie() failed to scrape "audio" field. Error: ${err}`,
    );
  }

  try {
    notes = await noteSection.$eval(
      `::-p-xpath(.//div[./div[contains(concat(' ', normalize-space(@class), ' '), ' field-name ') and contains(normalize-space(.), 'NOTES')]]/*[contains(concat(' ', normalize-space(@class), ' '), ' field-editor ')]//*[contains(concat(' ', normalize-space(@class), ' '), ' ProseMirror ')])`,
      (el) => (el as HTMLElement).innerText.trim(),
    );
  } catch (err) {
    // logger.error(`scrapeMovie() failed to scrape "notes" field. Error: ${err}`);
    throw new Error(
      `scrapeMovie() failed to scrape "notes" field. Error: ${err}`,
    );
  }

  try {
    isOneCharacterWord = await noteSection.$eval(
      `::-p-xpath(.//div[./div[contains(concat(' ', normalize-space(@class), ' '), ' field-name ') and contains(normalize-space(.), 'IS IT A ONE-CHARACTER WORD?')]]/*[contains(concat(' ', normalize-space(@class), ' '), ' field-editor ')]//*[contains(concat(' ', normalize-space(@class), ' '), ' ProseMirror ')])`,
      (el) => !!(el as HTMLElement).innerText.trim(),
    );
  } catch (err) {
    // logger.error(
    //   `scrapeMovie() failed to scrape "isOneCharacterWord" field. Error: ${err}`,
    // );
    throw new Error(
      `scrapeMovie() failed to scrape "isOneCharacterWord" field. Error: ${err}`,
    );
  }

  const movie: MovieCreateInput = {
    hanzi: character,
    keyword,
    pinyin,
    audio: { create: audio },
    notes,
    isOneCharacterWord,
  };

  return movie;
}
