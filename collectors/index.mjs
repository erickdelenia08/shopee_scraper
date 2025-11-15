import StealthPlugin from "puppeteer-extra-plugin-stealth";
import puppeteerExtra from "puppeteer-extra";
import { saveJSON } from "./utils/save.mjs";
import getProductLinks from "./listPage.mjs";

puppeteerExtra.use(StealthPlugin());

// CONNECT ke Chrome Debug yang sudah login
const browser = await puppeteerExtra.connect({
  browserURL: "http://127.0.0.1:9222",
  defaultViewport: null,
});

const pages = await browser.pages();
const page = pages[0];

// const links=collectProductLinks('headset',page)
const links= await getProductLinks(page,'headset',2)
console.log(links);

saveJSON(links, './data/links.json');

await browser.close();

