import { writeFileSync } from "fs";

function saveJSON(data, filePath) {
  writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`✅ Data berhasil disimpan ke ${filePath}`);
}

export {saveJSON};
