import StealthPlugin from "puppeteer-extra-plugin-stealth";
import puppeteerExtra from "puppeteer-extra";
import { saveJSON } from "./utils/save.mjs";
import getProductLinks from "./collectors/listPage.mjs";
import { loadLinks } from "./utils/loadLinks.mjs";
import getProductDetail from "./scrappers/detailPage.mjs";

puppeteerExtra.use(StealthPlugin());

// CONNECT ke Chrome Debug yang sudah login
const browser = await puppeteerExtra.connect({
  browserURL: "http://127.0.0.1:9222",
  defaultViewport: null,
});

const pages = await browser.pages();
const page = pages[0];

let links = loadLinks();

if (!links) {
  console.log("🔄 No existing links, scraping fresh list...");
  links = await getProductLinks(page, "headset", 2);
  saveJSON(links, "./data/links.json");
}

const products = [];
for (const link of links) {
  try {
    const detail = await getProductDetail(page, link);
    products.push(detail);
    console.log("✔ Scraped:", detail.title);
  } catch (err) {
    console.error("❌ Gagal scrape:", link, err.message);
  }
}

saveJSON(products, "./data/products.json");
// await browser.close();
