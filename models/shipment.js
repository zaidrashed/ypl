/**
 * Shipment Model
 * نموذج الشحنة
 */

/**
 * تحويل بيانات شحنة Shipsy إلى صيغة موحدة
 */
class Shipment {
  constructor(shipsyData) {
    this.consignmentId = shipsyData.consignment_id || shipsyData.id;
    this.awbNumber = shipsyData.awb_number || "";
    this.currentStatus = shipsyData.current_status || "pending";
    this.lastUpdated = shipsyData.last_updated || new Date().toISOString();

    // تتبع الشحنة
    this.tracking = {
      currentStatus: shipsyData.current_status,
      lastLocation: shipsyData.last_location || "",
      lastUpdate: shipsyData.last_updated,
      trackingUrl: this.buildTrackingUrl(shipsyData.awb_number),
    };

    // معلومات المستقبل
    this.destination = {
      name: shipsyData.consignee_name || "",
      phone: shipsyData.consignee_phone || "",
      address: shipsyData.consignee_address || "",
      city: shipsyData.consignee_city || "",
      state: shipsyData.consignee_state || "",
      pincode: shipsyData.consignee_pincode || "",
    };

    // معلومات المرسل
    this.origin = {
      name: shipsyData.shipper_name || "",
      phone: shipsyData.shipper_phone || "",
      address: shipsyData.shipper_address || "",
    };

    // تفاصيل الشحنة
    this.details = {
      weight: shipsyData.weight || 0,
      dimensions: {
        length: shipsyData.length || 0,
        width: shipsyData.width || 0,
        height: shipsyData.height || 0,
      },
      declaredValue: shipsyData.declared_value || 0,
      codAmount: shipsyData.cod_amount || 0,
    };

    // سجل الحالة
    this.statusHistory = shipsyData.status_history || [];
  }

  /**
   * الحصول على وصف الحالة بالعربية
   */
  getStatusDescription() {
    const statusMap = {
      pickup_scheduled: "جدول الاستلام",
      out_for_pickup: "جاري الاستلام",
      reached_at_hub: "وصل المركز",
      in_transit: "في الطريق",
      outfordelivery: "جاري التوصيل",
      attempted: "محاولة توصيل",
      delivered: "تم التسليم",
      cancelled: "ملغى",
      pending: "قيد الانتظار",
    };

    return statusMap[this.currentStatus] || this.currentStatus;
  }

  /**
   * بناء رابط التتبع
   */
  buildTrackingUrl(awbNumber) {
    if (!awbNumber) return "";

    // يمكن تخصيص الرابط حسب شركة الشحن
    return `https://shipsy.io/tracking/${awbNumber}`;
  }

  /**
   * التحقق من اكتمال الشحنة
   */
  isDelivered() {
    return this.currentStatus === "delivered";
  }

  /**
   * التحقق من إلغاء الشحنة
   */
  isCancelled() {
    return this.currentStatus === "cancelled";
  }

  /**
   * التحقق من قيد الانتظار
   */
  isPending() {
    return (
      this.currentStatus === "pending" ||
      this.currentStatus === "pickup_scheduled"
    );
  }

  /**
   * تحويل إلى JSON
   */
  toJSON() {
    return {
      consignmentId: this.consignmentId,
      awbNumber: this.awbNumber,
      currentStatus: this.currentStatus,
      statusDescription: this.getStatusDescription(),
      lastUpdated: this.lastUpdated,
      tracking: this.tracking,
      destination: this.destination,
      origin: this.origin,
      details: this.details,
      statusHistory: this.statusHistory,
    };
  }
}

module.exports = Shipment;
