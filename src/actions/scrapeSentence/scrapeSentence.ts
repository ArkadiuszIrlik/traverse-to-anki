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

  // Listen for any console messages from the page
  page.on('console', (msg) => {
    // Filter by type if you only want logs, not warnings/errors
    if (msg.type() === 'log') {
      // msg.text() holds the text passed to console.log(...)
      console.log(`PAGE LOG> ${msg.text()}`);
    }
  });

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
    // RENAME THIS
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
    context = await noteSection.$$eval(
      'div:not([class]) > div.ProseMirror:has(> h2:first-child) > p',
      (els) => {
        // tempContainer used to easily trim empty <p> elements on either end
        // of the section
        console.log(els.length);
        const tempContainer = document.createElement('div');
        let i = 0;
        let hasContextSectionStarted = false;
        while (i < els.length) {
          const currentEl = els[i];
          console.log(currentEl);
          //   If you want to work around stripFormatCharacters() not being available inside the
          // callback, you could just replicate this logic with a loop inside your own app, that
          // calls evaluate() for every elementHandle, going back and forth.
          console.log(
            'Is empty: ' + stripFormatCharacters(currentEl.innerHTML).trim() ===
              '',
          );
          // end section on sentence audio
          if (currentEl.querySelector('audio')) {
            break;
          }
          console.log(currentEl.innerHTML);
          // start section on empty <p>
          if (!hasContextSectionStarted && currentEl.innerHTML.trim() === '') {
            hasContextSectionStarted = true;
            i++;
            continue;
          }

          if (hasContextSectionStarted) {
            console.log('appending');
            tempContainer.appendChild(currentEl.cloneNode(true));
          }

          //   stringifiedHTML += currentEl.outerHTML;
          i++;
        }
        console.log(tempContainer);

        const nodesToTrim: HTMLElement[] = [];
        // trim empty nodes from section start
        for (let j = 0; j < tempContainer.children.length; j++) {
          const currentChild = tempContainer.children[j];
          console.log(currentChild);
          if (!(currentChild instanceof HTMLElement)) break;
          if (currentChild.innerText.trim() === '') {
            nodesToTrim.push(currentChild);
          } else {
            break;
          }
        }
        // trim empty nodes from section end
        for (let j = tempContainer.children.length - 1; j >= 0; j--) {
          const currentChild = tempContainer.children[j];
          if (!(currentChild instanceof HTMLElement)) break;
          if (currentChild.innerText.trim() === '') {
            nodesToTrim.push(currentChild);
          } else {
            break;
          }
        }
        console.log([...nodesToTrim]);
        nodesToTrim.forEach((node) => {
          node.remove();
        });

        let stringifiedHTML = '';
        for (let j = 0; j < tempContainer.children.length; j++) {
          const currentChild = tempContainer.children[j];
          stringifiedHTML += currentChild.outerHTML;
        }

        return stringifiedHTML;
      },
    );
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
