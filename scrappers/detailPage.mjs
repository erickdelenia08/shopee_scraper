import extractShopeeIDs from "../utils/extract_url.mjs";
import { extractProductData, extractShop } from "../utils/extractor.mjs";
import waitForShopeeCaptcha from "../waitCaptcha.mjs";

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


async function getProductDetail(page, link, browser) {
  // delay(3000)
  await page.goto(link, { waitUntil: "networkidle2" });
  await waitForShopeeCaptcha(page, browser);

  const { itemid, shopid } = extractShopeeIDs(link);

  const prod = await page.evaluate(
    async ({ itemid, shopid }) => {
      // Fetch product detail
      const productRes = await fetch(
        `https://shopee.co.id/api/v4/item/get?itemid=${itemid}&shopid=${shopid}`
      );
      const productJson = await productRes.json();

      return productJson.data || null;
    },
    { itemid, shopid }
  );

  const shop = await page.evaluate(
    async ({ shopid }) => {
      const shopRes = await fetch(
        `https://shopee.co.id/api/v4/shop/get_shop_detail?shopid=${shopid}`
      );
      const shopJson = await shopRes.json();

      return shopJson.data || null;
    },
    { shopid }
  );

  // console.log(prod);

  const { product, variants, attributes } = extractProductData(prod);
  const new_shop = extractShop(shop);

  return { url:link,product, variants, attributes, shop:new_shop };
}

export default getProductDetail;
