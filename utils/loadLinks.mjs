import fs from "fs";

export function loadLinks() {
  const file = "./data/links.json";

  // Jika file tidak ada ⇒ return false
  if (!fs.existsSync(file)) {
    console.log("⚠️ Link file not found, starting fresh...");
    return false;
  }

  try {
    const data = fs.readFileSync(file, "utf-8");
    const parsed = JSON.parse(data);

    if (!Array.isArray(parsed)) return false;

    console.log(`📂 Loaded ${parsed.length} links from file.`);
    return parsed;
  } catch (err) {
    console.log("⚠️ Error loading file, starting fresh...");
    return false;
  }
}
