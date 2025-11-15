import extractShopeeIDs from "../utils/extract_url.mjs";
import waitForShopeeCaptcha from "../waitCaptcha.mjs";

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getProductDetail(page, link) {
  // ==== OPEN PRODUCT PAGE ====
  await page.goto(link, { waitUntil: "networkidle2" });
  await waitForShopeeCaptcha(page);

  // ==== WAIT PRODUCT TITLE ====
  await page.waitForSelector("h1", { timeout: 20000 }).catch(() => {});

  // Tunggu sampai judul benar-benar punya teks
  await page.waitForFunction(
    () => {
      const t = document.querySelector("h1");
      return t && t.innerText.trim().length > 0;
    },
    { timeout: 20000 }
  );

  const {shop_id, item_id}=extractShopeeIDs(page.url())

  const shop = await page.evaluate((shop_id) => {
    const shop = document.querySelector("#sll2-pdp-product-shop");

    // Default tipe toko
    let shop_type = "regular"; // Biasa/toko biasa

    if (shop) {
      // 1️⃣ Cek Shopee Mall / Official Store
      if (shop.querySelector(".official-shop-new-badge")) {
        shop_type = "Shopee Mall";
      } else {
        // 2️⃣ Cek Star / Star+
        const starEl = shop.querySelector(".zSRu9M.GYplQ6.fY6r8Z");
        if (starEl) {
          const text = starEl.textContent.trim();
          if (text.includes("Star+")) {
            shop_type = "Star+";
          } else if (text.includes("Star")) {
            shop_type = "Star";
          }
        }
      }
    }

    const getText = (sel) =>
      document.querySelector(sel)?.innerText.trim() || null;

    const getLocation = () => {
      let lokasi = "Unknown";
      const keywords = ["dikirim dari", "ships from"];

      document.querySelectorAll("div.ybxj32").forEach((el) => {
        const label =
          el.querySelector("h3")?.innerText?.trim().toLowerCase() || "";
        if (keywords.some((kw) => label.includes(kw))) {
          const val = el.querySelector("div")?.innerText?.trim();
          if (val) lokasi = val;
        }
      });

      return lokasi;
    };

    let name = getText("div.fV3TIn");
    let rating = getText("div.NGzCXN > div:nth-child(1) > span");
    let total_products = getText("div.NGzCXN > a > span");
    let chat_response_rate = getText("div.NGzCXN > div:nth-child(2) > span");
    let joined_years_ago = getText("div.NGzCXN > div:nth-child(3) > span");
    let followers = getText("div.NGzCXN > div:nth-child(6) > span");

    return {
      shop_id,
      name,
      rating,
      total_products,
      chat_response_rate,
      joined_years_ago,
      followers,
      shop_type,
      location: getLocation(),
    };
  },shop_id);

  const specifications = await page.evaluate(() => {
    const specSection = document.querySelector("section.I_DV_3 .Gf4Ro0");
    if (!specSection) return null;

    const specs = {};

    specSection.querySelectorAll(".ybxj32").forEach((el) => {
      const key = el.querySelector("h3.VJOnTD")?.innerText?.trim();
      if (!key) return;

      // Untuk kategori (ada beberapa <a>) atau value tunggal
      const links = el.querySelectorAll("a.EtYbJs");
      if (links.length > 0) {
        specs[key] = Array.from(links).map((a) => a.innerText.trim());
      } else {
        const value = el.querySelector("div")?.innerText?.trim() || null;
        specs[key] = value;
      }
    });

    return specs;
  });

  // ==== SCRAPE BASIC PRODUCT INFO ====
  const product = await page.evaluate(() => {
    const getText = (sel) =>
      document.querySelector(sel)?.innerText.trim() || null;
    const getLocation = () => {
      let lokasi = "Unknown";
      const keywords = ["dikirim dari", "ships from"];

      document.querySelectorAll("div.ybxj32").forEach((el) => {
        const label =
          el.querySelector("h3")?.innerText?.trim().toLowerCase() || "";
        if (keywords.some((kw) => label.includes(kw))) {
          const val = el.querySelector("div")?.innerText?.trim();
          if (val) lokasi = val;
        }
      });

      return lokasi;
    };

    const category = Array.from(
      document.querySelectorAll("div.flex.items-center.idLK2l a")
    ).map((el) => el.innerText.trim());

    return {
      title: getText("h1"),
      price: getText(".ZA5sW5"),
      sold: getText("button:nth-child(1) .F9RHbS"),
      discountPrice: getText(".IZPeQz.B67UQ0"),
      rating: getText("button:nth-child(1) .jMXp4d"),

      shopName: getText("#sll2-pdp-product-shop .fV3TIn"),
      shopeLocation: getLocation(),

      reviewCount: getText("button:nth-child(2) .F9RHbS"),

      category,
      description: document.querySelector("div.product-detail.page-product__detail > section:nth-child(2) > div > div")?.innerText,
    };
  });

  // Ambil semua tombol varian
  const variantButtons = await page.$$("button.sApkZm");

  let variants = [];

  for (let i = 0; i < variantButtons.length; i++) {
    // Klik varian ke-i
    await variantButtons[i].click();

    // Tunggu UI update stok
    await page.waitForSelector(
      "section.flex.items-center.OaFP0p div:last-child",
      {
        visible: true,
      }
    );

    await delay(1100);

    // Ambil nama varian (innerText dari span)
    const variantName = await page.evaluate((el) => {
      return el.querySelector("span")?.innerText || null;
    }, variantButtons[i]);

    // Ambil price & stock
    const { normalPrice, discountPrice, stockText } = await page.evaluate(
      () => {
        return {
          normalPrice:
            document.querySelector(".ZA5sW5")?.innerText.trim() || null,
          discountPrice:
            document.querySelector(".IZPeQz.B67UQ0")?.innerText.trim() || null,
          stockText:
            document.querySelector(
              "section.flex.items-center.OaFP0p div:last-child"
            )?.innerText || null,
        };
      }
    );

    let stock = stockText ? parseInt(stockText.replace(/\D/g, ""), 10) : null;

    variants.push({
      variant: variantName,
      stock: stock,
      normalPrice,
      discountPrice,
    });
  }

  return {item_id,
    ...product,
    url: link,
    variants,
    shop,
    specifications,
  };
}

export default getProductDetail;
