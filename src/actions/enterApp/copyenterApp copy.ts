import { URL_APP_PAGE } from "@config/url";
import type { Page } from "puppeteer";
import { login } from "src/actions/login/login";
import logger from "src/logger/logger";

export async function enterApp(page: Page) {
  const appResponse = await page.goto(URL_APP_PAGE);
  if (!appResponse) {
    logger.fatal(
      `Didn't get a response when navigating to: ${URL_APP_PAGE}. Shutting down.`
    );
    throw new Error("Couldn't enter app.");
    // browser.close();
    // CLOSE THE ACTUAL APP HERE
  }
  if (appResponse?.url() !== URL_APP_PAGE) {
    logger.info("Redirected from app. Assuming unauthenticated response.");
    try {
      await login(page);
      const res = await page.waitForNavigation();
      if (!res) throw new Error("Didn't navigate on login.");
      if (res.url() !== URL_APP_PAGE)
        throw new Error(
          `After login navigated to ${res.url()} instead of ${URL_APP_PAGE}.`
        );
    } catch (err) {
      logger.error(err);
      logger.fatal("Couldn't log into app. Shutting down.");
      throw new Error("Couldn't enter app.");
      // CLOSE THE APP HERE
    }
  }

  return page;
}
