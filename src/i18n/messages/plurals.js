// Count-based labels. English uses one/other; Arabic uses all six CLDR forms (zero is picked for 0).
const ar = (zero, one, two, few, many, other) => ({ zero, one, two, few, many, other });
const en = (one, other) => ({ one, other });

export default {
  en: {
    "count.products": en("{count} product", "{count} products"),
    "count.items": en("{count} item", "{count} items"),
    "count.reviews": en("{count} review", "{count} reviews"),
    "count.orders": en("{count} order", "{count} orders"),
    "count.results": en("{count} result", "{count} results"),
    "count.addresses": en("{count} address", "{count} addresses"),
    "count.categories": en("{count} category", "{count} categories"),
    "unit.products": en("product", "products"),
    "unit.orders": en("order", "orders"),
    "unit.reviews": en("review", "reviews"),
    "unit.offers": en("offer", "offers"),
    "unit.items": en("item", "items"),
    "unit.users": en("user", "users"),
    "unit.coupons": en("coupon", "coupons"),
    "unit.results": en("result", "results"),
  },
  ar: {
    "count.products": ar("لا منتجات", "منتج واحد", "منتجان", "{count} منتجات", "{count} منتجًا", "{count} منتج"),
    "count.items": ar("لا عناصر", "عنصر واحد", "عنصران", "{count} عناصر", "{count} عنصرًا", "{count} عنصر"),
    "count.reviews": ar("لا تقييمات", "تقييم واحد", "تقييمان", "{count} تقييمات", "{count} تقييمًا", "{count} تقييم"),
    "count.orders": ar("لا طلبات", "طلب واحد", "طلبان", "{count} طلبات", "{count} طلبًا", "{count} طلب"),
    "count.results": ar("لا نتائج", "نتيجة واحدة", "نتيجتان", "{count} نتائج", "{count} نتيجة", "{count} نتيجة"),
    "count.addresses": ar("لا عناوين", "عنوان واحد", "عنوانان", "{count} عناوين", "{count} عنوانًا", "{count} عنوان"),
    "unit.products": ar("منتج", "منتجًا", "منتجين", "منتجات", "منتجًا", "منتج"),
    "unit.orders": ar("طلب", "طلبًا", "طلبين", "طلبات", "طلبًا", "طلب"),
    "unit.reviews": ar("تقييم", "تقييمًا", "تقييمين", "تقييمات", "تقييمًا", "تقييم"),
    "unit.offers": ar("عرض", "عرضًا", "عرضين", "عروض", "عرضًا", "عرض"),
    "unit.items": ar("عنصر", "عنصرًا", "عنصرين", "عناصر", "عنصرًا", "عنصر"),
    "unit.users": ar("مستخدم", "مستخدمًا", "مستخدمين", "مستخدمين", "مستخدمًا", "مستخدم"),
    "unit.coupons": ar("كوبون", "كوبونًا", "كوبونين", "كوبونات", "كوبونًا", "كوبون"),
    "unit.results": ar("نتيجة", "نتيجة", "نتيجتين", "نتائج", "نتيجة", "نتيجة"),
    "count.categories": ar("لا فئات", "فئة واحدة", "فئتان", "{count} فئات", "{count} فئة", "{count} فئة"),
  },
};
