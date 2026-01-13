/**
 * Helper Utilities
 * دوال مساعدة متنوعة
 */

/**
 * تأخير التنفيذ
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * محاولة مجددة
 */
async function retry(fn, options = {}) {
  const { maxRetries = 3, delayMs = 1000, backoff = 2 } = options;
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        const waitTime = delayMs * Math.pow(backoff, attempt);
        await delay(waitTime);
      }
    }
  }

  throw lastError;
}

/**
 * تنسيق الهاتف
 */
function formatPhoneNumber(phone) {
  // إزالة الأحرف غير الرقمية
  const cleaned = phone.replace(/\D/g, "");

  // إذا كان يبدأ بـ 966 (السعودية)
  if (cleaned.startsWith("966")) {
    return "+" + cleaned;
  }

  // إذا كان يبدأ بـ 0
  if (cleaned.startsWith("0")) {
    return "+966" + cleaned.substring(1);
  }

  return "+" + cleaned;
}

/**
 * التحقق من صحة البريد الإلكتروني
 */
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * التحقق من صحة رقم الهاتف
 */
function isValidPhoneNumber(phone) {
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length >= 10;
}

/**
 * حساب أيام التأخير بين تاريخين
 */
function getDaysDifference(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * تحويل العملة
 */
function formatCurrency(amount, currency = "SAR") {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

/**
 * تحويل التاريخ للصيغة العربية
 */
function formatDateArabic(date) {
  const d = new Date(date);
  return d.toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * بناء عنوان كامل
 */
function buildFullAddress(addressObj) {
  const parts = [
    addressObj.address_line_1,
    addressObj.address_line_2,
    addressObj.city,
    addressObj.state,
    addressObj.pincode,
    addressObj.country,
  ];

  return parts.filter((part) => part && part.trim()).join(", ");
}

/**
 * حساب وزن الشحنة من المنتجات
 */
function calculateWeight(items) {
  let totalWeight = 0;
  items.forEach((item) => {
    if (item.grams) {
      totalWeight += (item.grams * item.quantity) / 1000;
    }
  });
  return totalWeight;
}

/**
 * حساب القيمة الإجمالية
 */
function calculateTotal(items) {
  return items.reduce((total, item) => {
    return total + parseFloat(item.price) * item.quantity;
  }, 0);
}

module.exports = {
  delay,
  retry,
  formatPhoneNumber,
  isValidEmail,
  isValidPhoneNumber,
  getDaysDifference,
  formatCurrency,
  formatDateArabic,
  buildFullAddress,
  calculateWeight,
  calculateTotal,
};
