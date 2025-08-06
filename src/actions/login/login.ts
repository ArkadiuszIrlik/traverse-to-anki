import { URL_LOGIN_PAGE } from "@config/url";
import path from "path";
import { Page } from "puppeteer";
console.log(path.resolve("." + "/folder"));
export const myName = "bob";

export async function login(page: Page) {
  await page.goto(URL_LOGIN_PAGE);

  // enter email
  if (!process.env.TRAVERSE_LOGIN) {
    throw new Error("Missing TRAVERSE_LOGIN env variable");
  }
  await page.locator('input[type="email"]').fill(process.env.TRAVERSE_LOGIN);

  // enter password
  if (!process.env.TRAVERSE_PASS) {
    throw new Error("Missing TRAVERSE_PASS env variable");
  }
  await page.locator('input[type="password"]').fill(process.env.TRAVERSE_PASS);

  // Hit login button
  await page.locator("button::-p-text(Log in)").click();

  return page;
}
