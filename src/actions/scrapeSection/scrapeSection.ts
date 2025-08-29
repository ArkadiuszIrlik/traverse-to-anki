import {
  getLessonCallStackPretty,
  getSectionCallStackPretty,
} from '@helpers/helpers';
import logger from '@logger/logger';
import type { ElementHandle, Page } from 'puppeteer';
import scrapeMovie from 'src/actions/scrapeMovie/scrapeMovie';
import scrapeProp from 'src/actions/scrapeProp/scrapeProp';
import scrapeSentence from 'src/actions/scrapeSentence/scrapeSentence';

enum SectionType {
  Vocab = 'VOCAB',
  Characters = 'CHARACTERS',
}
const vocabRegex = /(V.I.C.)|(句子)|(语境)/;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function _getSectionType(page: Page, sectionName: string) {
  switch (true) {
    case sectionName.includes('汉字'):
      return SectionType.Characters;
    case vocabRegex.test(sectionName):
      return SectionType.Vocab;
    default:
      return null;
  }
}

async function _getLessonHandles(page: Page, sectionName: string) {
  // const lessonHandles = await page.$$(
  //   `main div:not([class]) > div::-p-text(${sectionName}) ~ div`,
  // );
  // const lessonHandles = await page.$$(
  //   `main div:not([class]) > div::-p-text(${sectionName}) ~ div`,
  // );
  // await page.waitForSelector(
  //   `::-p-xpath(//main//div[not(@class)]/div[contains(normalize-space(.), "${sectionName}")]/following-sibling::div[string-length(normalize-space(text())) > 0])`,
  // );

  // wait for elements to populate with innerText
  await page.waitForSelector(
    `::-p-xpath(//main//div[not(@class)]/div[contains(normalize-space(.), "${sectionName}")]/following-sibling::div[normalize-space(.)])`,
  );

  const lessonHandles = await page.$$(
    `::-p-xpath(//main//div[not(@class)]/div[contains(normalize-space(.), "${sectionName}")]/following-sibling::div)`,
  );

  return lessonHandles;
}

export default async function scrapeSection(
  page: Page,
  deckName: string,
  sectionName: string,
) {
  return;
  console.log('scrapeSection enters');
  const sectionType = _getSectionType(page, sectionName);

  if (sectionType === null) {
    logger.error(
      `Couldn't determine section type for "${sectionName}" (${getSectionCallStackPretty(deckName, sectionName)})`,
    );
    throw new Error(
      `Couldn't determine section type for "${sectionName}" (${getSectionCallStackPretty(deckName, sectionName)})`,
    );
  }

  let initialLessonHandles: Awaited<ReturnType<typeof _getLessonHandles>>;
  try {
    initialLessonHandles = await _getLessonHandles(page, sectionName);
  } catch (err) {
    logger.error(err);
    throw new Error(err);
  }
  if (initialLessonHandles.length === 0) {
    logger.warn(
      `No lessons found for "${sectionName}" section (${getSectionCallStackPretty(deckName, sectionName)}).`,
    );
  }

  const lessonNames: string[] = [];
  for (let i = 0; i < initialLessonHandles.length; i++) {
    const currentHandle = initialLessonHandles[i];
    // handle rejection
    const nextName = await currentHandle.evaluate((el) => el.innerText);

    lessonNames.push(nextName);
  }

  for (let i = 0; i < lessonNames.length; i++) {
    console.log('scrapeSection() loop: ' + i);
    const currentLesson = lessonNames[i];
    console.log('_getLessonHandles waiting...');
    const lessonHandles = await _getLessonHandles(page, sectionName);
    console.log('Done!');

    let currentHandle: ElementHandle<HTMLElement> | null = null;
    for (let j = 0; j < lessonHandles.length; j++) {
      // handle rejection
      const handleText = await lessonHandles[j].evaluate((el) => el.innerText);
      if (handleText === currentLesson) {
        currentHandle = lessonHandles[j];
        break;
      }
    }

    if (!currentHandle) {
      logger.error(
        `Couldn't find handle for lesson "${currentLesson}" (${getLessonCallStackPretty(deckName, sectionName, currentLesson)})`,
      );
      continue;
    }
    // navigate to lesson
    try {
      console.log('scrapeSection() waiting for lesson navigation...');
      // this bit causes problems with the client-side routing used by traverse
      // await Promise.all([page.waitForNavigation(), currentHandle.click()]);
      await currentHandle.click();
      console.log('Done!');
    } catch (err) {
      logger.error(
        `Couldn't navigate to lesson "${currentLesson}" (${getLessonCallStackPretty(deckName, sectionName, currentLesson)}). Error: ${err}`,
      );

      // navigate back to section page
      /*
      const res = await page.goto(initialUrl, { waitUntil: 'networkidle2' });
      if (res && res?.ok()) {
        continue;
      } else {
        logger.error(`Couldn't navigate back to ${initialUrl}.`);
        throw new Error(`Couldn't navigate back to ${initialUrl}.`);
      }
        */
      await _navigateToSectionPage(page, sectionName);
    }

    try {
      switch (true) {
        case sectionType === SectionType.Vocab:
          await scrapeSentence(page);
          break;
        case currentLesson.includes('PROP'):
          await scrapeProp(page);
          break;
        // not very robust to assume it's going to be a movie
        // could be a new type of lesson instead
        default:
          await scrapeMovie(page);
      }
    } catch (err) {
      logger.error(`Error while scraping url: ${page.url()}. Error: ${err}`);
    }

    // navigate back to section page
    /*
      const res = await page.goto(initialUrl, { waitUntil: 'networkidle2' });
      if (res && res?.ok()) {
        continue;
      } else {
        logger.error(`Couldn't navigate back to ${initialUrl}.`);
        throw new Error(`Couldn't navigate back to ${initialUrl}.`);
      }
        */
    //  UNNECESSARY. THE SUBSEQUENT LESSONS ARE ALWAYS VISIBLE.
    // await _navigateToSectionPage(page, sectionName);
  }
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
