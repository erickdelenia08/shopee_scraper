import getProductLinks from "../collectors/listPage.mjs";
import getProductDetail from "./detailPage.mjs";


async function scrapeShopee(page, keyword, maxPages) {
  const links = await getProductLinks(page, keyword, maxPages);

  const products = [];
  for (const link of links) {
    try {
      const detail = await getProductDetail(page, link);
      products.push({ link, ...detail });
      console.log("✔ Scraped:", detail.title);
    } catch (err) {
      console.error("❌ Gagal scrape:", link, err.message);
    }
  }

  return products;
}

export default scrapeShopee;
