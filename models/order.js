/**
 * Order Model
 * نموذج الطلب
 */

/**
 * تحويل بيانات طلب Shopify إلى صيغة موحدة
 */
class Order {
  constructor(shopifyOrder) {
    this.id = shopifyOrder.id;
    this.orderId = shopifyOrder.order_number;
    this.email = shopifyOrder.email;
    this.phone = shopifyOrder.customer?.phone || "";
    this.status = shopifyOrder.financial_status;
    this.fulfillmentStatus = shopifyOrder.fulfillment_status;

    // معلومات العميل
    this.customer = {
      firstName:
        shopifyOrder.customer?.first_name ||
        shopifyOrder.billing_address?.first_name ||
        "",
      lastName:
        shopifyOrder.customer?.last_name ||
        shopifyOrder.billing_address?.last_name ||
        "",
      email: shopifyOrder.email,
      phone:
        shopifyOrder.customer?.phone ||
        shopifyOrder.billing_address?.phone ||
        "",
    };

    // عنوان الشحن
    this.shippingAddress = {
      firstName: shopifyOrder.shipping_address?.first_name || "",
      lastName: shopifyOrder.shipping_address?.last_name || "",
      address1: shopifyOrder.shipping_address?.address1 || "",
      address2: shopifyOrder.shipping_address?.address2 || "",
      city: shopifyOrder.shipping_address?.city || "",
      province: shopifyOrder.shipping_address?.province || "",
      zip: shopifyOrder.shipping_address?.zip || "",
      country: shopifyOrder.shipping_address?.country || "",
      phone: shopifyOrder.shipping_address?.phone || "",
    };

    // عنوان الفاتورة
    this.billingAddress = {
      firstName: shopifyOrder.billing_address?.first_name || "",
      lastName: shopifyOrder.billing_address?.last_name || "",
      address1: shopifyOrder.billing_address?.address1 || "",
      address2: shopifyOrder.billing_address?.address2 || "",
      city: shopifyOrder.billing_address?.city || "",
      province: shopifyOrder.billing_address?.province || "",
      zip: shopifyOrder.billing_address?.zip || "",
      country: shopifyOrder.billing_address?.country || "",
      phone: shopifyOrder.billing_address?.phone || "",
    };

    // السلع
    this.items = shopifyOrder.line_items.map((item) => ({
      id: item.id,
      sku: item.sku || item.product_id,
      title: item.title,
      quantity: item.quantity,
      price: item.price,
      grams: item.grams || 0,
      vendor: item.vendor || "",
    }));

    // المجاميع المالية
    this.totals = {
      subtotal: parseFloat(shopifyOrder.subtotal_price || 0),
      tax: parseFloat(shopifyOrder.total_tax || 0),
      shippingPrice: parseFloat(
        shopifyOrder.total_shipping_price_set?.shop_money?.amount || 0
      ),
      total: parseFloat(shopifyOrder.total_price || 0),
      currency: shopifyOrder.currency,
    };

    // التواريخ
    this.dates = {
      created: shopifyOrder.created_at,
      updated: shopifyOrder.updated_at,
      processed: shopifyOrder.processed_at,
    };

    // معلومات إضافية
    this.notes = shopifyOrder.note || "";
    this.tags = shopifyOrder.tags || "";
    this.reference = shopifyOrder.reference;
  }

  /**
   * التحقق من صحة الطلب
   */
  validate() {
    const errors = [];

    if (!this.shippingAddress.firstName || !this.shippingAddress.lastName) {
      errors.push("اسم المستقبل مطلوب");
    }

    if (!this.shippingAddress.address1) {
      errors.push("عنوان الشحن مطلوب");
    }

    if (!this.shippingAddress.city) {
      errors.push("المدينة مطلوبة");
    }

    if (!this.shippingAddress.zip) {
      errors.push("الرمز البريدي مطلوب");
    }

    if (!this.shippingAddress.phone) {
      errors.push("رقم الهاتف مطلوب");
    }

    if (this.items.length === 0) {
      errors.push("الطلب يجب أن يحتوي على سلع واحدة على الأقل");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * حساب الوزن الإجمالي
   */
  getTotalWeight() {
    return this.items.reduce((total, item) => {
      return total + ((item.grams || 0) * item.quantity) / 1000;
    }, 0);
  }

  /**
   * تحويل إلى JSON
   */
  toJSON() {
    return {
      id: this.id,
      orderId: this.orderId,
      email: this.email,
      phone: this.phone,
      status: this.status,
      fulfillmentStatus: this.fulfillmentStatus,
      customer: this.customer,
      shippingAddress: this.shippingAddress,
      billingAddress: this.billingAddress,
      items: this.items,
      totals: this.totals,
      dates: this.dates,
      notes: this.notes,
      tags: this.tags,
      totalWeight: this.getTotalWeight(),
    };
  }
}

module.exports = Order;
