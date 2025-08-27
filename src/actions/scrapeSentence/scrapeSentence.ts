import type {
  SentenceAudioCreateInput,
  SentenceCreateInput,
} from '@generated/prisma/models';
import { getFilenameFromURL, stripFormatCharacters } from '@utils/string';
import type { Page } from 'puppeteer';

export default async function scrapeSentence(
  page: Page,
): Promise<SentenceCreateInput> {
  await page.waitForSelector(
    'main div.reveal-prompt div.field-name::-p-text(Personal Notes)',
  );

  const noteSection = await page.$('main div.reveal-prompt');
  if (!noteSection) {
    throw new Error('scrapeSentence() failed to find noteSection.');
  }

  let text: string,
    highlightStartIndex: number,
    highlightEndIndex: number,
    highlightText: string,
    highlightMeaning: string,
    context: string,
    audio: SentenceAudioCreateInput[],
    personalNotes: string;

  try {
    const sentenceTextHandle = await noteSection.$(
      'div:not([class]) > div.ProseMirror > h2',
    );
    if (!sentenceTextHandle)
      throw new Error('Sentence text not found on page.');

    text = await sentenceTextHandle.evaluate((el) => el.innerText.trim());
    highlightStartIndex = await sentenceTextHandle.evaluate((el) => {
      const innerTrimmed = el.innerHTML.trim();
      const highlightIdentifier = '<mark';
      const lengthBefore = innerTrimmed.split(highlightIdentifier)[0].length;
      return lengthBefore;
    });
    // throws error when element not found
    highlightText = await sentenceTextHandle.$eval(
      'mark.highlight-review',
      (el) => el.innerText,
    );
    highlightEndIndex = highlightStartIndex + highlightText.length;
  } catch (err) {
    throw new Error(
      `scrapeSentence() failed to scrape sentence text. Error: ${err}`,
    );
  }

  try {
    highlightMeaning = await noteSection.$$eval(
      'div:not([class]) > div.ProseMirror:has(> h2:first-child) > p',
      (els) => {
        let stringifiedHTML = '';
        let i = 0;
        while (i < els.length) {
          const currentEl = els[i];
          if (currentEl.innerHTML.trim() === '') {
            break;
          }
          stringifiedHTML += currentEl.outerHTML;
          i++;
        }

        return stringifiedHTML;
      },
    );
  } catch (err) {
    throw new Error(
      `scrapeSentence() failed to scrape "highlightMeaning" field. Error: ${err}`,
    );
  }

  try {
    let sectionStartIndex = -1;
    let sectionEndIndex = -1; // non-inclusive

    const pHandles = await noteSection.$$(
      'div:not([class]) > div.ProseMirror:has(> h2:first-child) > p',
    );
    for (let i = 0; i < pHandles.length; i++) {
      const currentHandle = pHandles[i];
      sectionEndIndex = i;

      // section ends on sentence audio
      const hasAudioChild = !!(await currentHandle.$('audio'));
      if (hasAudioChild) {
        break;
      }

      // section starts on first empty <p>
      const handleInnerHTML = await currentHandle.evaluate(
        (el) => el.innerHTML,
      );
      if (
        sectionStartIndex === -1 &&
        stripFormatCharacters(handleInnerHTML).trim() === ''
      ) {
        sectionStartIndex = i;
        continue;
      }
    }

    let firstNonEmptyIndex = -1;
    let lastNonEmptyIndex = -1; // inclusive
    for (let i = sectionStartIndex; i < sectionEndIndex; i++) {
      const currentHandle = pHandles[i];
      const handleInnerHTML = await currentHandle.evaluate(
        (el) => el.innerHTML,
      );
      const isEmpty = stripFormatCharacters(handleInnerHTML).trim() === '';
      if (firstNonEmptyIndex === -1 && !isEmpty) {
        firstNonEmptyIndex = i;
      }
      if (!isEmpty) {
        lastNonEmptyIndex = i;
      }
    }

    let stringifiedHTML = '';
    if (firstNonEmptyIndex !== -1 && lastNonEmptyIndex !== -1) {
      for (let i = firstNonEmptyIndex; i <= lastNonEmptyIndex; i++) {
        const currentHandle = pHandles[i];
        const handleOuterHTML = await currentHandle.evaluate(
          (el) => el.outerHTML,
        );
        stringifiedHTML += handleOuterHTML;
      }
    }
    context = stringifiedHTML;
  } catch (err) {
    throw new Error(
      `scrapeSentence() failed to scrape "context" field. Error: ${err}`,
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
    throw new Error(
      `scrapeSentence() failed to scrape "audio" field. Error: ${err}`,
    );
  }

  try {
    personalNotes = await noteSection.$eval(
      `::-p-xpath(.//div[./div[contains(concat(' ', normalize-space(@class), ' '), ' field-name ') and contains(normalize-space(.), 'Personal Notes')]]/*[contains(concat(' ', normalize-space(@class), ' '), ' field-editor ')]//*[contains(concat(' ', normalize-space(@class), ' '), ' ProseMirror ')])`,
      (el) => (el as HTMLElement).innerText.trim(),
    );
  } catch (err) {
    throw new Error(
      `scrapeSentence() failed to scrape "personalNotes" field. Error: ${err}`,
    );
  }

  const sentence: SentenceCreateInput = {
    text,
    highlightStartIndex,
    highlightEndIndex,
    highlightText,
    highlightMeaning,
    context,
    personalNotes,
    audio: { create: audio },
  };

  return sentence;
}
