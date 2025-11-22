import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { saveJSON } from "./utils/save.mjs";

puppeteerExtra.use(StealthPlugin());

// CONNECT ke Chrome Debug yang sudah login
const browser = await puppeteerExtra.connect({
  browserURL: "http://127.0.0.1:9222",
  defaultViewport: null,
});

const pages = await browser.pages();
const page = pages[0];

const url =
  "https://shopee.co.id/";

console.log("🔄 Membuka halaman produk...");
await page.goto(url, { waitUntil: "networkidle2" });

// ambil data JSON preload
const data = await page.evaluate(async () => {
  const shopid = "462050918";
  const itemid = "40663524266";
  const res = await fetch(
    `https://shopee.co.id/api/v4/item/get?itemid=${itemid}&shopid=${shopid}`
    // `https://shopee.co.id/api/v4/shop/get_shop_detail?shopid=${shopid}`
  );
  const data = await res.json();
  return data;
});

if (!data) console.log("❌ ERROR: Tidak menemukan PRELOADED_STATE");

console.log("✅ Data ditemukan!");
console.log(data);

saveJSON(data, "./data/gg.json");
