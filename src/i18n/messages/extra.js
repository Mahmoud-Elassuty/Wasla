// Phase 7 additions: labels that were still hardcoded in constants/slices (dashboard nav, category
// copy, checkout payment hints, failed-action messages). Same shape as the other modules.
const arPlural = (zero, one, two, few, many, other) => ({ zero, one, two, few, many, other });

export default {
  en: {
    "nav.moreItems": { one: "+{count} more item", other: "+{count} more items" },
    "nav.orders": "Orders",
    "nav.reviews": "Reviews",
    "nav.coupons": "Coupons",
    "nav.emails": "Emails",
    "nav.banners": "Banners",
    "nav.users": "Users",
    "nav.storeProfile": "Store profile",

    "category.beauty.label": "Beauty & Scents",
    "category.fragrances.label": "Fragrances",
    "category.furniture.label": "Home & Furniture",
    "category.groceries.label": "Fresh Groceries",

    "offers.productsOnSale": { one: "{count} product on sale", other: "{count} products on sale" },

    "payopt.cod.hint": "Pay in cash when your order arrives.",
    "payopt.credit_card.hint": "Pay online with Visa, Mastercard or Amex.",
    "payopt.paypal.hint": "Pay using your PayPal account.",
    "payopt.wallet.hint": "Apple Pay or Google Pay.",

    "err.updateOrderStatus": "Couldn't update the order status. {error}",
    "err.deleteProduct": "Couldn't delete the product. {error}",
    "err.deleteReview": "Couldn't delete the review. {error}",
    "err.updateReview": "Couldn't update the review. {error}",
    "err.deleteCoupon": "Couldn't delete the coupon. {error}",
    "err.updateCoupon": "Couldn't update the coupon. {error}",
    "err.deleteAddress": "Couldn't delete the address. {error}",
    "err.setDefaultAddress": "Couldn't set the default address. {error}",

    "order.titleWithNumber": "Order {number}",
    "order.note": "Note: {note}",
    "cart.alreadyInCart": "{count} already in your cart.",
    "store.couponWithCode": "Coupon ({code})",
    "admin.bannerCount": { one: "{count} banner", other: "{count} banners" },
    "admin.couponCount": { one: "{count} coupon", other: "{count} coupons" },
    "admin.refreshFailed": "Refresh failed: {error}",
    "admin.setBannerActive": "Set {title} active",
    "admin.setBannerInactive": "Set {title} inactive",
    "admin.moveReviewUp": "Move review by {name} up",
    "admin.moveReviewDown": "Move review by {name} down",
    "admin.waslaCustomer": "Wasla customer",
  },
  ar: {
    "nav.moreItems": arPlural("لا عناصر إضافية", "+عنصر إضافي واحد", "+عنصران إضافيان", "+{count} عناصر إضافية", "+{count} عنصرًا إضافيًا", "+{count} عنصر إضافي"),
    "nav.orders": "الطلبات",
    "nav.reviews": "التقييمات",
    "nav.coupons": "الكوبونات",
    "nav.emails": "البريد",
    "nav.banners": "اللافتات",
    "nav.users": "المستخدمون",
    "nav.storeProfile": "ملف المتجر",

    "category.beauty.label": "الجمال والعطور",
    "category.fragrances.label": "العطور",
    "category.furniture.label": "المنزل والأثاث",
    "category.groceries.label": "بقالة طازجة",

    "offers.productsOnSale": arPlural("لا منتجات في العرض", "منتج واحد في العرض", "منتجان في العرض", "{count} منتجات في العرض", "{count} منتجًا في العرض", "{count} منتج في العرض"),

    "payopt.cod.hint": "ادفع نقدًا عند وصول طلبك.",
    "payopt.credit_card.hint": "ادفع إلكترونيًا باستخدام فيزا أو ماستركارد أو أمريكان إكسبريس.",
    "payopt.paypal.hint": "ادفع باستخدام حساب PayPal الخاص بك.",
    "payopt.wallet.hint": "Apple Pay أو Google Pay.",

    "err.updateOrderStatus": "تعذّر تحديث حالة الطلب. {error}",
    "err.deleteProduct": "تعذّر حذف المنتج. {error}",
    "err.deleteReview": "تعذّر حذف التقييم. {error}",
    "err.updateReview": "تعذّر تحديث التقييم. {error}",
    "err.deleteCoupon": "تعذّر حذف الكوبون. {error}",
    "err.updateCoupon": "تعذّر تحديث الكوبون. {error}",
    "err.deleteAddress": "تعذّر حذف العنوان. {error}",
    "err.setDefaultAddress": "تعذّر تعيين العنوان الافتراضي. {error}",

    "order.titleWithNumber": "طلب {number}",
    "order.note": "ملاحظة: {note}",
    "cart.alreadyInCart": "لديك {count} من هذا المنتج في سلتك بالفعل.",
    "store.couponWithCode": "الكوبون ({code})",
    "admin.bannerCount": arPlural("لا لافتات", "لافتة واحدة", "لافتتان", "{count} لافتات", "{count} لافتة", "{count} لافتة"),
    "admin.couponCount": arPlural("لا كوبونات", "كوبون واحد", "كوبونان", "{count} كوبونات", "{count} كوبونًا", "{count} كوبون"),
    "admin.refreshFailed": "فشل التحديث: {error}",
    "admin.setBannerActive": "تفعيل {title}",
    "admin.setBannerInactive": "إلغاء تفعيل {title}",
    "admin.moveReviewUp": "نقل تقييم {name} لأعلى",
    "admin.moveReviewDown": "نقل تقييم {name} لأسفل",
    "admin.waslaCustomer": "عميل وصلة",
  },
};
