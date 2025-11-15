import puppeteer from "puppeteer-core";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import puppeteerExtra from "puppeteer-extra";
import { existsSync, readFileSync } from "fs";
import scrapeShopee from "./scrapper/index.mjs";
import { saveJSON } from "./utils/save.mjs";
import {
  keyword,
  maxPages,
  outputFile,
  CHROME_PATH,
  USER_DATA_DIR,
  COOKIES_FILE,
} from "./config.mjs";

puppeteerExtra.use(StealthPlugin());

// CONNECT ke Chrome Debug yang sudah login
const browser = await puppeteerExtra.connect({
  browserURL: "http://127.0.0.1:9222",
  defaultViewport: null,
});

const pages = await browser.pages();
const page = pages[0];

console.log("🔗 Terhubung ke Chrome Debug Mode (sudah login Shopee)");

const products = await scrapeShopee(page, keyword, maxPages);

saveJSON(products, outputFile);

await browser.close();