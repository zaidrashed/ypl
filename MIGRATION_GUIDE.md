/\*\*

- Controllers Migration Guide
- دليل تحديث الـ Controllers لدعم متعدد المتاجر
  \*/

// ❌ الطريقة القديمة (متجر واحد ثابت):
// const SHOP_URL = process.env.SHOPIFY_SHOP_URL;
// const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

// ✅ الطريقة الجديدة (متعدد المتاجر):
// const shopUrl = req.shopUrl; // من middleware
// const accessToken = req.accessToken; // من middleware
// const shop = req.shop; // كائن المتجر كاملاً

/\*\*

- مثال: تحديث Order Controller
  \*/

const shopifyService = require('../services/shopify-service');
const shipsyService = require('../services/shipsy-service');
const shopService = require('../services/shop-service');
const db = require('../database/connection');
const logger = require('../utils/logger');

class OrderController {
/\*\*

- الحصول على جميع الطلبيات للمتجر الحالي
-
- REQUEST:
- GET /api/orders?shop=example.myshopify.com
- Header: Authorization: Bearer example.myshopify.com
-
- RESPONSE:
- {
-     success: true,
-     shop: "example.myshopify.com",
-     count: 10,
-     orders: [...]
- }
  \*/
  async getAllOrders(req, res) {
  try {
  // middleware وفّر لنا هذه البيانات:
  const shopUrl = req.shopUrl; // ✅ محددة من middleware
  const accessToken = req.accessToken; // ✅ محددة من middleware

      // استرجاع الطلبيات من Shopify
      const orders = await shopifyService.getOrders(shopUrl, accessToken);

      // تسجيل الطلبيات في قاعدة البيانات (اختياري)
      for (const order of orders) {
        await db.query(
          `INSERT INTO orders (shop_url, order_id, order_data, sync_status)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (shop_url, order_id) DO UPDATE SET
           order_data = $3, updated_at = NOW()`,
          [shopUrl, order.id, JSON.stringify(order), 'synced']
        );
      }

      res.json({
        success: true,
        shop: shopUrl,
        count: orders.length,
        orders: orders,
      });

  } catch (error) {
  logger.error('Error getting orders:', error);
  res.status(500).json({
  error: error.message,
  message: 'حدث خطأ في استرجاع الطلبيات',
  });
  }
  }

/\*\*

- مزامنة طلبية معينة مع Shipsy
-
- REQUEST:
- POST /api/orders/:orderId/sync?shop=example.myshopify.com
-
- RESPONSE:
- {
-     success: true,
-     consignmentId: "SHIPSY_ID",
-     trackingNumber: "123456"
- }
  \*/
  async syncOrder(req, res) {
  try {
  const shopUrl = req.shopUrl;
  const accessToken = req.accessToken;
  const orderId = req.params.orderId;

      // الحصول على الطلبية من Shopify
      const order = await shopifyService.getOrder(shopUrl, accessToken, orderId);

      // الحصول على إعدادات Shipsy للمتجر
      const shop = await shopService.getShopByUrl(shopUrl);
      if (!shop.shipsy_api_key) {
        return res.status(400).json({
          error: 'Shipsy not configured',
          message: 'لم يتم تكوين بيانات Shipsy للمتجر',
        });
      }

      // إرسال الطلبية إلى Shipsy
      const consignment = await shipsyService.createConsignment(
        order,
        shop.shipsy_api_key,
        shop.shipsy_org_id
      );

      // تحديث قاعدة البيانات
      await db.query(
        `INSERT INTO orders (shop_url, order_id, shipsy_consignment_id, tracking_number, sync_status, synced_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (shop_url, order_id) DO UPDATE SET
         shipsy_consignment_id = $3, tracking_number = $4, sync_status = $5, synced_at = NOW()`,
        [shopUrl, orderId, consignment.id, consignment.trackingNumber, 'synced']
      );

      // تسجيل عملية المزامنة
      await db.query(
        `INSERT INTO sync_logs (shop_url, order_id, shipsy_consignment_id, status)
         VALUES ($1, $2, $3, $4)`,
        [shopUrl, orderId, consignment.id, 'success']
      );

      res.json({
        success: true,
        shop: shopUrl,
        orderId: orderId,
        consignmentId: consignment.id,
        trackingNumber: consignment.trackingNumber,
      });

  } catch (error) {
  logger.error('Error syncing order:', error);

      // تسجيل الخطأ
      await db.query(
        `INSERT INTO sync_logs (shop_url, order_id, status, error_message)
         VALUES ($1, $2, $3, $4)`,
        [req.shopUrl, req.params.orderId, 'error', error.message]
      );

      res.status(500).json({
        error: error.message,
        message: 'فشلت مزامنة الطلبية',
      });

  }
  }

/\*\*

- الحصول على حالة الشحنة
-
- REQUEST:
- GET /api/orders/:orderId/status?shop=example.myshopify.com
  \*/
  async getShipmentStatus(req, res) {
  try {
  const shopUrl = req.shopUrl;
  const orderId = req.params.orderId;

      // الحصول على بيانات الطلبية من قاعدة البيانات
      const order = await db.getOne(
        `SELECT * FROM orders WHERE shop_url = $1 AND order_id = $2`,
        [shopUrl, orderId]
      );

      if (!order) {
        return res.status(404).json({
          error: 'Order not found',
          message: 'لم تُجد الطلبية في قاعدة البيانات',
        });
      }

      if (!order.shipsy_consignment_id) {
        return res.status(400).json({
          error: 'Order not synced',
          message: 'الطلبية لم تُمزامن مع Shipsy بعد',
        });
      }

      // الحصول على الحالة من Shipsy
      const shop = await shopService.getShopByUrl(shopUrl);
      const status = await shipsyService.getConsignmentStatus(
        order.shipsy_consignment_id,
        shop.shipsy_api_key
      );

      res.json({
        success: true,
        shop: shopUrl,
        orderId: orderId,
        consignmentId: order.shipsy_consignment_id,
        trackingNumber: order.tracking_number,
        status: status,
      });

  } catch (error) {
  logger.error('Error getting shipment status:', error);
  res.status(500).json({
  error: error.message,
  message: 'حدث خطأ في الحصول على حالة الشحنة',
  });
  }
  }

/\*\*

- تحميل تسمية الشحنة
-
- REQUEST:
- GET /api/orders/:orderId/label?shop=example.myshopify.com&format=pdf
  \*/
  async downloadLabel(req, res) {
  try {
  const shopUrl = req.shopUrl;
  const orderId = req.params.orderId;
  const format = req.query.format || 'pdf';

        // الحصول على الطلبية
        const order = await db.getOne(
          `SELECT * FROM orders WHERE shop_url = $1 AND order_id = $2`,
          [shopUrl, orderId]
        );

        if (!order?.shipsy_consignment_id) {
          return res.status(400).json({
            error: 'No shipment',
            message: 'لا توجد شحنة لهذه الطلبية',
          });
        }

        // الحصول على التسمية من Shipsy
        const shop = await shopService.getShopByUrl(shopUrl);
        const label = await shipsyService.getLabel(
          order.shipsy_consignment_id,
          shop.shipsy_api_key,
          format
        );

        res.set('Content-Type', 'application/pdf');
        res.set('Content-Disposition', `attachment; filename="label-${orderId}.pdf"`);
        res.send(label);
      } catch (error) {
        logger.error('Error downloading label:', error);
        res.status(500).json({
          error: error.message,
          message: 'فشل تحميل التسمية',
        });
      }

  }
  }

module.exports = new OrderController();

/\*\*

- 📝 ملاحظات التحديث:
-
- 1.  جميع الدوال الآن تستقبل shopUrl و accessToken من middleware
- 2.  قاعدة البيانات تحفظ shop_url مع كل عملية
- 3.  لا توجد متغيرات بيئية ثابتة (hardcoded values)
- 4.  كل عملية تُسجل في sync_logs مع shop_url
- 5.  معالجة أخطاء شاملة مع تسجيل العمليات
-
- 🔄 نمط المتعدد المتاجر:
- req.shopUrl → shop_url من middleware
- req.accessToken → access_token من middleware
- req.shop → كائن المتجر كاملاً (مع إعدادات Shipsy)
-
- ✅ الفوائد:
- - دعم آلاف المتاجر في نفس الوقت
- - فصل بيانات كل متجر عن الآخر
- - سهولة الصيانة والتطوير
- - قابل للتوسع (Scalable)
    \*/
