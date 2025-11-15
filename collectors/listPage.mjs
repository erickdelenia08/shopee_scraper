// fungsi bantu untuk scroll biar semua produk ke-load

import waitForShopeeCaptcha from "../waitCaptcha.mjs"; // kalau kamu split file

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 500; // scroll tiap 500px
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 300); // jeda 0.3s biar Shopee sempat render
    });
  });
}

async function getProductLinks(page, keyword, maxPages) {
  const productLinks = [];

  for (let pageNum = 0; pageNum < maxPages; pageNum++) {
    await page.goto(
      `https://shopee.co.id/search?keyword=${keyword}&page=${pageNum}`,
      { waitUntil: "networkidle2" }
    );
    await waitForShopeeCaptcha(page);

    // scroll full page biar semua card muncul
    await autoScroll(page);

    const links = await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll("#main div.u37U8O section ul li")
      )
        .map((card) => {
          const a = card.querySelector("a.contents");
          if (!a) return null;
          let href = a.getAttribute("href");
          if (!href) return null;
          return href.startsWith("http")
            ? href
            : "https://shopee.co.id" + href;
        })
        .filter(Boolean);
    });

    productLinks.push(...links);
    console.log(`Halaman ${pageNum + 1} -> ${links.length} produk`);
  }

  return productLinks;
}

export default getProductLinks;
