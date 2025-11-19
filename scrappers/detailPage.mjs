import extractShopeeIDs from "../utils/extract_url.mjs";
import waitForShopeeCaptcha from "../waitCaptcha.mjs";

function joinVariant(v1, v2) {
  if (!v1 && !v2) return null;
  if (v1 && !v2) return v1;
  if (!v1 && v2) return v2;
  return `${v1} / ${v2}`;
}

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getProductDetail(page, link, browser) {
  // ==== OPEN PRODUCT PAGE ====
  await page.goto(link, { waitUntil: "networkidle2" });
  await waitForShopeeCaptcha(page, browser);

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

  const { shop_id, item_id } = extractShopeeIDs(page.url());

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
  }, shop_id);

  const specifications = await page.evaluate(() => {
    const specSection = document.querySelector("section.I_DV_3 .Gf4Ro0");
    if (!specSection) return null;

    const specs = {};

    specSection.querySelectorAll(".ybxj32").forEach((el) => {
      const keyEl = el.children[0]; // h3
      const valEl = el.children[1]; // div atau <a>

      if (!keyEl || !valEl) return;

      const key = keyEl.innerText.trim();
      if (!key) return;

      // Jika value punya banyak <a> → array (kategori)
      const links = valEl.querySelectorAll("a");
      if (links.length > 0) {
        specs[key] = Array.from(links).map((a) => a.innerText.trim());
      } else {
        // Selain kategori → single text / single <a> (brand, stock, warranty, dll.)
        specs[key] = valEl.innerText.trim();
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

    const fav = document.querySelector(
      "div.flex.items-center.feDSnr > button > div"
    );

    let match;
    if (fav) match = fav.innerText.match(/\(([^)]+)\)/);

    const category = Array.from(
      document.querySelectorAll("div.flex.items-center.idLK2l a")
    ).map((el) => el.innerText.trim());

    return {
      title: getText("h1"),
      price: getText(".ZA5sW5"),
      sold_count: getText("div.flex.asFzUa > div > div.aleSBU > span"),
      discount_price: getText(".IZPeQz.B67UQ0"),
      rating: getText("button:nth-child(1) .jMXp4d"),
      favourite_count: match ? match[1].trim() : null,
      shop_name: getText("#sll2-pdp-product-shop .fV3TIn"),
      shope_location: getLocation(),

      review_count: getText("button:nth-child(2) .F9RHbS"),

      category,
      description: document.querySelector(
        "div.product-detail.page-product__detail > section:nth-child(2) > div > div"
      )?.innerText,
    };
  });

  const variantSections = await page.$$(
    "section.flex.items-center:not(.OaFP0p)" // skip 'Kuantitas'
  );

  let variantGroups = [];

  for (const section of variantSections) {
    const title = await section.$eval("h2", (h) =>
      h.innerText.trim().toUpperCase()
    );
    if (title === "KUANTITAS") continue;

    const buttons = await section.$$("button.sApkZm");
    if (buttons.length > 0) variantGroups.push(buttons);
  }

  let variants = [];

  // ==== CASE 0 LEVEL ====
  if (variantGroups.length === 0) {
    const { normalPrice, discountPrice, stockText } = await page.evaluate(
      () => ({
        normalPrice:
          document.querySelector(".ZA5sW5")?.innerText.trim() || null,
        discountPrice:
          document.querySelector(".IZPeQz.B67UQ0")?.innerText.trim() || null,
        stockText:
          document.querySelector(
            "section.flex.items-center.OaFP0p div:last-child"
          )?.innerText || null,
      })
    );

    variants.push({
      variant: null,
      stock: stockText ? parseInt(stockText.replace(/\D/g, "")) : null,
      price: normalPrice,
      discount_price: discountPrice,
    });
  }

  // ==== CASE 1 LEVEL ====
  else if (variantGroups.length === 1) {
    const group = variantGroups[0];

    for (const btn of group) {
      const isDisabled = await btn.evaluate(
        (b) => b.getAttribute("aria-disabled") === "true"
      );
      const name = await btn.evaluate((b) => b.getAttribute("aria-label"));

      if (isDisabled) {
        variants.push({
          variant: name,
          stock: 0,
          price: null,
          discount_price: null,
        });
        continue;
      }

      await btn.click();
      await delay(1100);

      const { normalPrice, discountPrice, stockText } = await page.evaluate(
        () => ({
          normalPrice:
            document.querySelector(".ZA5sW5")?.innerText.trim() || null,
          discountPrice:
            document.querySelector(".IZPeQz.B67UQ0")?.innerText.trim() || null,
          stockText:
            document.querySelector(
              "section.flex.items-center.OaFP0p div:last-child"
            )?.innerText || null,
        })
      );

      variants.push({
        variant: name,
        stock: stockText ? parseInt(stockText.replace(/\D/g, "")) : null,
        price: normalPrice,
        discount_price: discountPrice,
      });
    }
  }

  // ==== CASE 2 LEVEL ====
  else if (variantGroups.length === 2) {
    const [group1, group2] = variantGroups;

    for (const btn1 of group1) {
      const isDisabled1 = await btn1.evaluate(
        (b) => b.getAttribute("aria-disabled") === "true"
      );
      const name1 = await btn1.evaluate((b) => b.getAttribute("aria-label"));

      if (isDisabled1) {
        for (const btn2 of group2) {
          const name2 = await btn2.evaluate((b) =>
            b.getAttribute("aria-label")
          );
          variants.push({
            variant: joinVariant(name1, name2),
            stock: 0,
            price: null,
            discount_price: null,
          });
        }
        continue;
      }

      await btn1.click();
      await delay(300);

      for (const btn2 of group2) {
        const isDisabled2 = await btn2.evaluate(
          (b) => b.getAttribute("aria-disabled") === "true"
        );
        const name2 = await btn2.evaluate((b) => b.getAttribute("aria-label"));

        if (isDisabled2) {
          variants.push({
            variant: joinVariant(name1, name2),
            stock: 0,
            price: null,
            discount_price: null,
          });
          continue;
        }

        await btn2.click();
        await delay(1200);

        const { normalPrice, discountPrice, stockText } = await page.evaluate(
          () => ({
            normalPrice:
              document.querySelector(".ZA5sW5")?.innerText.trim() || null,
            discountPrice:
              document.querySelector(".IZPeQz.B67UQ0")?.innerText.trim() ||
              null,
            stockText:
              document.querySelector(
                "section.flex.items-center.OaFP0p div:last-child"
              )?.innerText || null,
          })
        );

        variants.push({
         variant: joinVariant(name1, name2),
          stock: stockText ? parseInt(stockText.replace(/\D/g, "")) : null,
          price: normalPrice,
          discount_price: discountPrice,
        });
      }
    }
  }

  return { item_id, ...product, url: link, variants, shop, specifications };
}

export default getProductDetail;
