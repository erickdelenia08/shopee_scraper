// export default async function waitForShopeeCaptcha(page) {
//   // console.log("⏳ Mengecek apakah Shopee meminta verifikasi...");

//   while (true) {
//     const url = page.url();

//     if (url.includes("verify")) {
//       console.log("🛑 Shopee meminta CAPTCHA! Selesaikan manual di browser...");
      
//       // cek tiap 2 detik apakah captcha selesai
//       await new Promise(res => setTimeout(res, 2000));
//       continue;
//     }

//     // jika captcha sudah selesai → URL kembali normal
//     if (!url.includes("verify")) {
//       // console.log("✅ Captcha selesai, melanjutkan proses...");
//       return;
//     }
//   }
// }


export default async function waitForShopeeCaptcha(page, browser) {
  const url = page.url();

  if (url.includes("verify")) {
    console.log("🛑 CAPTCHA terdeteksi! Menutup Chrome Debug...");

    try {
      await browser.close();  // Ini nutup Chrome debug yang kamu connect
    } catch (e) {
      console.log("⚠️ Chrome Debug mungkin sudah tertutup.");
    }

    throw new Error("CAPTCHA detected. Stopping scraper.");
  }

  return;
}
