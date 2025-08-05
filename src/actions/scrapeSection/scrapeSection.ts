import {
  getLessonCallStackPretty,
  getSectionCallStackPretty,
} from '@helpers/helpers';
import logger from '@logger/logger';
import type { ElementHandle, Page } from 'puppeteer';

enum SectionType {
  Vocab = 'VOCAB',
  Characters = 'CHARACTERS',
}
const vocabRegex = /(V.I.C.)|(句子)|(语境)/;

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
  const lessonHandles = await page.$$(
    `main div:not([class]) > div::-p-text(${sectionName}) ~ div`,
  );
  return lessonHandles;
}

export default async function scrapeSection(
  page: Page,
  deckName: string,
  sectionName: string,
) {
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

  const initialUrl = page.url();
  for (let i = 0; i < lessonNames.length; i++) {
    const currentLesson = lessonNames[i];
    const lessonHandles = await _getLessonHandles(page, sectionName);

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
      await Promise.all([page.waitForNavigation(), currentHandle.click()]);
    } catch (err) {
      logger.error(
        `Couldn't navigate to lesson "${currentLesson}" (${getLessonCallStackPretty(deckName, sectionName, currentLesson)}). Error: ${err}`,
      );

      // navigate back to section page
      const res = await page.goto(initialUrl, { waitUntil: 'networkidle2' });
      if (res && res?.ok()) {
        continue;
      } else {
        logger.error(`Couldn't navigate back to ${initialUrl}.`);
        throw new Error(`Couldn't navigate back to ${initialUrl}.`);
      }
    }

    switch (true) {
      case sectionType === SectionType.Vocab:
        scrapeSentence();
        break;
      case currentLesson.includes('(PROP)'):
        scrapeProp();
        break;
      // not very robust to assume it's going to be a movie
      // could be a new type of lesson instead
      default:
        scrapeMovie();
    }

    // navigate back to section page
    const res = await page.goto(initialUrl, { waitUntil: 'networkidle2' });
    if (res && res?.ok()) {
      continue;
    } else {
      logger.error(`Couldn't navigate back to ${initialUrl}.`);
      throw new Error(`Couldn't navigate back to ${initialUrl}.`);
    }
  }
}
