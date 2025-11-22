function extractProductData(item) {
  // console.log("cek kateogori");
  // console.log(item.categories);
  const { category_names, category_ids, category_main } = extractCategories(
    item.categories
  );

  // --- PRODUCT ---
  const product = {
    itemid: item.itemid,
    shopid: item.shopid,

    name: item.name,
    brand: item.brand || null,
    brand_id: item.brand_id || null,
    condition: item.condition || null,

    // Harga
    price_min: item.price_min ?? null,
    price_max: item.price_max ?? null,
    price: item.price ?? null,

    price_before_discount: item.price_before_discount ?? null,
    price_max_before_discount: item.price_max_before_discount ?? null,
    price_min_before_discount: item.price_min_before_discount ?? null,
    discount: item.discount ?? null,

    // category
    category_ids,
    category_main,
    category_names,

    // Performansi
    historical_sold: item.historical_sold ?? null,
    sold: item.sold ?? null,

    rating: item.item_rating?.rating_star ?? null,
    rating_count: item.item_rating?.rating_count ?? null,
    cmt_count: item.cmt_count ?? null,
    liked_count: item.liked_count ?? null,

    // Info toko
    shop_name: item.shop_name ?? null,
    shop_location: item.shop_location ?? null,
    is_official_shop: item.is_official_shop ?? false,

    // Lainnya
    stock: item.stock ?? null,
    ctime: item.ctime ?? null,
    discount: item.discount ?? null,

    description: item.description ?? null,
  };

  // --- VARIANTS ---
  const variants = Array.isArray(item.models)
    ? item.models.map((v) => ({
        itemid: item.itemid,
        // modelid: v.modelid,
        variant_name: v.name,
        price: v.price ?? null,
        price_before_discount: v.price_before_discount ?? null,
        stock: v.stock ?? 0,
      }))
    : [];

  // --- ATTRIBUTES ---
  const attributes = (item.attributes ?? []).map((attr) => ({
    itemid: item.itemid,
    attr_name: attr?.name ?? null,
    attr_value: attr?.value ?? null,
  }));

  return {
    product,
    variants,
    attributes,
  };
}

function extractCategories(categories) {
  if (!categories || categories.length === 0) {
    return {
      category_main: null,
      category_ids: null,
      category_names: null,
    };
  }

  const names = categories.map((c) => c.display_name);
  const ids = categories.map((c) => c.catid);

  return {
    category_main: names[names.length - 1] || null, // subkategori terakhir
    category_ids: ids,
    category_names: names,
  };
}

function extractShop(shop) {
  if (!shop) return null;

  return {
    shopid: shop.shopid,
    name: shop.name,
    username: shop.account?.username,
    follower_count: shop.follower_count,
    rating_star: shop.rating_star,
    rating_good: shop.rating_good,
    rating_normal: shop.rating_normal,
    rating_bad: shop.rating_bad,
    response_rate: shop.response_rate,
    response_time: shop.response_time,
    shop_location: shop.shop_location,

    // Important flags
    is_verified: shop.is_shopee_verified,
    is_official_shop: shop.is_official_shop,
    is_preferred_plus: shop.is_preferred_plus_seller,

    has_shopee_flash_sale: shop.has_shopee_flash_sale,

    // Activity fields
    item_count: shop.item_count,
    ctime: shop.ctime,
    mtime: shop.mtime,
    last_active_time: shop.last_active_time,
    preparation_time: shop.preparation_time,
    cancellation_rate: shop.cancellation_rate,
  };
}

export { extractProductData, extractShop };
