export default async function waitForShopeeCaptcha(page) {
  console.log("⏳ Mengecek apakah Shopee meminta verifikasi...");

  while (true) {
    const url = page.url();

    if (url.includes("verify")) {
      console.log("🛑 Shopee meminta CAPTCHA! Selesaikan manual di browser...");
      
      // cek tiap 2 detik apakah captcha selesai
      await new Promise(res => setTimeout(res, 2000));
      continue;
    }

    // jika captcha sudah selesai → URL kembali normal
    if (!url.includes("verify")) {
      console.log("✅ Captcha selesai, melanjutkan proses...");
      return;
    }
  }
}
