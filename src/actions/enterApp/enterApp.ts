import { URL_APP_PAGE } from '@config/url';
import type { Page } from 'puppeteer';
import { login } from 'src/actions/login/login';
import logger from 'src/logger/logger';

async function _checkIfIsApp(page: Page) {
  const container = await page.$('main > div.welcome-container');
  return !!container;
}

export async function enterApp(page: Page) {
  await page.goto(URL_APP_PAGE);
  const isAppPage = await _checkIfIsApp(page);
  //   if (!appResponse) {
  //     logger.fatal(
  //       `Didn't get a response when navigating to: ${URL_APP_PAGE}. Shutting down.`
  //     );
  //     throw new Error("Couldn't enter app.");
  //     // browser.close();
  //     // CLOSE THE ACTUAL APP HERE
  //   }
  if (!isAppPage) {
    logger.info('Redirected from app. Assuming unauthenticated response.');
    try {
      await login(page);
      await page.waitForNavigation({ timeout: 10000 });
      const isNewAppPage = _checkIfIsApp(page);

      if (!isNewAppPage) {
        logger.error('After login attempt stuck at ' + page.url() + '.');
        throw new Error("Didn't navigate on login.");
      }
      //   if (res.url() !== URL_APP_PAGE)
      //     throw new Error(
      //       `After login navigated to ${res.url()} instead of ${URL_APP_PAGE}.`
      //     );
    } catch (err) {
      logger.error(err);
      //   logger.fatal("Couldn't log into app. Shutting down.");
      throw new Error("Couldn't enter app.");
      // CLOSE THE APP HERE
    }
  }

  return page;
}
