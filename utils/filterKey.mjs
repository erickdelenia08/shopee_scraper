export function isMatch(obj) {
  const filter = [
    "earphone",
    "earbud",
    "earbuds",
    "tws",
    "in-ear",
    "pods",
    "ear",
    "buds",
  ];
  let grade = 0;

  const tipeItem = obj.specifications?.["Tipe Earphone, Headphone & Headset"];
  if (tipeItem) {
    console.log("ada kok tipenya : ", tipeItem);
    const tipe = filter.some((keyword) =>
      tipeItem.toLowerCase().includes(keyword)
    );
    if (tipe) {
      console.log("lolos filter tipe");
      grade++;
    }
  }

  if (filter.some((keyword) => obj.title.toLowerCase().includes(keyword))) {
    console.log("lolos filter title");
    grade++;
  }

  const categories = obj.category || [];
  // --- cek apakah category mengandung headset/headphone ---
  const categoryKeywords = ["headset", "headphone"];

  const categoryMatch = categories
    .map((c) => c.toLowerCase())
    .some((c) => categoryKeywords.some((kw) => c.includes(kw)));
  if (categoryMatch) grade++;

  console.log("ini grade nya: ", grade);

  return grade > 1 ? true : false;
}
