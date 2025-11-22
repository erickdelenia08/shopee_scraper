function extractShopeeIDs(url) {
  const match = url.match(/i\.(\d+)\.(\d+)/);
  if (!match) return null;

  return {
    shopid: match[1],
    itemid: match[2]
  };
}

export default extractShopeeIDs