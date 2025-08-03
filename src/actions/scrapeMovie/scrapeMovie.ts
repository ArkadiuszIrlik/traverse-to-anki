import type { IMovieRepository } from '@db/movie.repository';
import logger from '@logger/logger';
import { getFilenameFromURL } from '@utils/string';
import type { Page } from 'puppeteer';

export default async function scrapeMovie(
  page: Page,
  deck: string,
  section: string,
  movieRepository: IMovieRepository,
) {
  console.log(1);
  console.log(page.url());
  await page.waitForSelector('main div.reveal-prompt');
  const noteSection = await page.$('main div.reveal-prompt');
  if (!noteSection) {
    // logger.error(`scrapeMovie() failed to find noteSection.`);
    console.log('this happened');
    throw new Error('scrapeMovie() failed to find noteSection.');
  }

  let character: string, keyword: string, pinyin: string, notes: string;
  try {
    character = await noteSection.$eval(
      //   'div.ProseMirror > h2::-p-text(Movie review)',
      `::-p-xpath(//div[contains(concat(' ', normalize-space(@class), ' '), ' ProseMirror ')]/h2[contains(normalize-space(.), 'Movie review')])`,
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
  console.log(character);
  //   console.log(1);
  //   const found = await noteSection.$eval(
  //     'div.ProseMirror > p::-p-text(Keyword)',
  //     (el) => console.log(el),
  //   );
  //   console.log(found);
  try {
    // keyword = await noteSection.$eval(
    //   'div.ProseMirror > p::-p-text(Keyword) + *',
    //   (el) => (el as HTMLElement).innerText.trim(),
    // );
    keyword = await noteSection.$eval(
      `::-p-xpath(//div[contains(concat(' ', normalize-space(@class), ' '), ' ProseMirror ')]/p[contains(normalize-space(.), "Keyword")]/following-sibling::*[1])`,
      (el) => (el as HTMLElement).innerText.trim(),
    );
    // keyword = await noteSection.$eval(
    //   `::-p-xpath(//div[contains(@class, 'ProseMirror')]/p[contains(text(), 'Keyword')]/following-sibling::*[1])`,
    //   (el) => (el as HTMLElement).innerText.trim(),
    // );
    // keyword = await noteSection.$eval(
    //   `::-p-xpath(//div[contains(@class, 'ProseMirror')]/p[contains(normalize-space(.), 'Keyword')]/following-sibling::*[1])`,
    //   (el) => (el as HTMLElement).innerText.trim(),
    // );
    // keyword = await noteSection.$eval(
    //   `::-p-xpath(//div[contains(@class, 'ProseMirror')])`,
    //   (el) => console.log(el),
    // );
  } catch (err) {
    // logger.error(
    //   `scrapeMovie() failed to scrape "keyword" field. Error: ${err}`,
    // );
    throw new Error(
      `scrapeMovie() failed to scrape "keyword" field. Error: ${err}`,
    );
  }
  console.log(keyword);

  try {
    pinyin = await noteSection.$eval(
      //   'div.ProseMirror > p::-p-text(Pinyin) + *',
      `::-p-xpath(//div[contains(concat(' ', normalize-space(@class), ' '), ' ProseMirror ')]/p[contains(normalize-space(.), 'Pinyin')]/following-sibling::*[1])`,
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

  let audio: { filename: string; originalUrl: string }[];
  try {
    const audioSources = await noteSection.$$eval(
      'div.ProseMirror audio',
      (els) => (els as HTMLAudioElement[]).map((el) => el.currentSrc),
    );
    audio = audioSources.map((src) => ({
      originalUrl: src,
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
      //   'div:has(div.field-name::-p-text(NOTES)) > .field-editor .ProseMirror',
      //   `::-p-xpath(//div[.//div[contains(concat(' ', normalize-space(@class), ' '), ' field-name ') and contains(normalize-space(.), 'NOTES')]]/*[contains(concat(' ', normalize-space(@class), ' '), ' field-editor ')]//*[contains(concat(' ', normalize-space(@class), ' '), ' ProseMirror ')])`,
      `::-p-xpath(//div[.//div[contains(concat(' ', normalize-space(@class), ' '), ' field-name ') and contains(normalize-space(.), 'NOTES')]]/*)`,
      //   (el) => (el as HTMLElement).innerText.trim(),
      (el) => console.log(el),
    );
  } catch (err) {
    // logger.error(`scrapeMovie() failed to scrape "notes" field. Error: ${err}`);
    throw new Error(
      `scrapeMovie() failed to scrape "notes" field. Error: ${err}`,
    );
  }

  console.log(notes);

  let isOneCharacterWord: boolean;
  try {
    isOneCharacterWord = await noteSection.$eval(
      'div:has(div.field-name::-p-text(IS IT A ONE-CHARACTER WORD?)) > .field-editor .ProseMirror',
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

  const movie = await movieRepository.create({
    hanzi: character,
    keyword,
    pinyin,
    audio: { create: audio },
    notes,
    isOneCharacterWord,
  });

  return movie;
}
