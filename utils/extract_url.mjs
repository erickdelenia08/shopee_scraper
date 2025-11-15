function extractShopeeIDs(url) {
  const match = url.match(/i\.(\d+)\.(\d+)/);
  if (!match) return null;

  return {
    shop_id: match[1],
    item_id: match[2]
  };
}

export default extractShopeeIDs