# دليل شامل: نسخة Shopify من Shipsy Econnect

## مقدمة

تم تطوير نسخة Shopify من تطبيق Shipsy Econnect بناءً على نفس مبادئ النسخة الأصلية لـ WooCommerce، لكن بمعمارية حديثة وقابلة للتوسع.

## الفروقات الجوهرية

### 1. نموذج المعمارية

#### WooCommerce Plugin

- **نوع**: إضافة WordPress (Plugin)
- **اللغة**: PHP
- **الاستضافة**: نفس خادم الموقع
- **قاعدة البيانات**: جداول WordPress الموجودة
- **التكامل**: مباشر عبر WordPress Hooks

#### Shopify App

- **نوع**: تطبيق Node.js مستقل
- **اللغة**: JavaScript/Node.js
- **الاستضافة**: خادم منفصل (AWS, Heroku, DigitalOcean, إلخ)
- **قاعدة البيانات**: ملفات محلية أو قاعدة بيانات خارجية
- **التكامل**: عبر Shopify Webhooks و REST API

### 2. تدفق المعالجة

#### WooCommerce Flow

```
إنشاء طلب في WooCommerce
         ↓
WordPress Hook (woocommerce_order_status_changed)
         ↓
Plugin Class (class-shipsy-econnect-admin.php)
         ↓
API Service (shipsy-softdata-upload-api.php)
         ↓
Shipsy API
         ↓
حفظ معرف الشحنة في ملاحظات الطلب
         ↓
Cron Job يحدث الحالة كل 15 دقيقة
```

#### Shopify Flow

```
إنشاء طلب في Shopify
         ↓
Shopify sends Webhook
         ↓
Express Server (routes/webhooks.js)
         ↓
Webhook Service (services/webhook-service.js)
         ↓
Sync Service (services/sync-service.js)
         ↓
Shipsy Service (services/shipsy-service.js)
         ↓
Shipsy API
         ↓
تحديث الطلب في Shopify
         ↓
Cron Jobs تحدث الحالة كل ساعة
```

## البنية الأساسية

### مقارنة المجلدات

| WooCommerce    | Shopify     | الوصف                       |
| -------------- | ----------- | --------------------------- |
| `/admin`       | `/routes`   | معالجة الطلبات والـ API     |
| `/admin/apis`  | `/services` | التكامل مع APIs الخارجية    |
| `/admin/crons` | `/crons`    | المهام المجدولة             |
| `/includes`    | `/config`   | الملفات الأساسية والإعدادات |
| `/public`      | `/views`    | الواجهات والصفحات           |

## ملفات القلب (Core Files)

### WooCommerce

```
shipsy-econnect.php
├── class-shipsy-econnect.php (الفئة الرئيسية)
├── class-shipsy-econnect-loader.php (محمل الخطافات)
├── class-shipsy-econnect-activator.php (التفعيل)
└── class-shipsy-econnect-deactivator.php (الإلغاء)
```

### Shopify

```
server.js (نقطة البداية)
├── config/settings.js (الإعدادات)
├── services/
│   ├── shipsy-service.js
│   ├── shopify-service.js
│   └── sync-service.js
└── routes/ (المسارات)
```

## الميزات المتشابهة

### ✅ المزامنة التلقائية

**WooCommerce:**

```php
do_action('woocommerce_order_status_changed');
// معالج الحدث في admin class
```

**Shopify:**

```javascript
router.post("/webhooks/orders", handleOrderCreated);
// معالجة webhook من Shopify
```

### ✅ تحديث الحالة

**WooCommerce:**

```php
// Cron job: shipsy-cron-handler.php
wp_schedule_event(time(), 'hourly', 'shipsy_update_status');
```

**Shopify:**

```javascript
// Cron job: crons/status-update-cron.js
cron.schedule("0 * * * *", updateStatuses);
```

### ✅ إدارة الإعدادات

**WooCommerce:**

```php
// صفحة في لوحة تحكم WordPress
add_menu_page('Shipsy Configuration', ...);
$api_key = get_option('shipsy_api_key');
```

**Shopify:**

```javascript
// صفحة ويب مستقلة
GET /admin/settings -> returns form HTML
PUT /api/settings -> updates configuration
```

## الاختلافات التقنية

### 1. المصادقة والأمان

**WooCommerce:**

- مفاتيح محفوظة في خيارات WordPress
- معالجة nonce للتحقق من الطلبات
- نظام الأدوار والأذونات في WordPress

**Shopify:**

- متغيرات البيئة (.env)
- التحقق من توقيع Webhook
- رموز الوصول OAuth (اختياري)

### 2. الدعم متعدد اللغات

**WooCommerce:**

```php
// استخدام WordPress translation functions
__('تم المزامنة', 'shipsy-econnect');
_e('تم المزامنة', 'shipsy-econnect');
```

**Shopify:**

```javascript
// يمكن إضافة دعم i18n لاحقاً
const messages = {
  ar: { success: "تم المزامنة" },
  en: { success: "Synced successfully" },
};
```

### 3. نظام التسجيل (Logging)

**WooCommerce:**

```php
// استخدام WooCommerce logging
$logger = new WC_Logger();
$logger->info('Order synced', array('order_id' => $order_id));
```

**Shopify:**

```javascript
// نظام logging مخصص
const logger = require("./utils/logger");
logger.info("Order synced", { orderId: order.id });
```

## البدء السريع

### المتطلبات

- Node.js 18+
- حساب Shopify Developer
- مفاتيح API من Shipsy

### خطوات التثبيت

1. **استنساخ المشروع**

```bash
git clone <repository_url>
cd shipsy-econnect-shopify
npm install
```

2. **إعداد متغيرات البيئة**

```bash
cp .env.example .env
# قم بملء المتغيرات المطلوبة
```

3. **تشغيل التطبيق**

```bash
npm run dev
```

4. **إعداد Webhook في Shopify**

- اذهب إلى إعدادات متجرك
- أضف webhook للأحداث:
  - `orders/create`
  - `orders/updated`
  - `app/uninstalled`

## نقاط الاختلاف في API

### Shipsy API Integration

**WooCommerce:**

```php
// في shipsy-softdata-upload-api.php
$response = wp_remote_post($url, array(
    'method' => 'POST',
    'headers' => array(
        'api-key' => SHIPSY_API_KEY,
        'Content-Type' => 'application/json'
    ),
    'body' => wp_json_encode($data)
));
```

**Shopify:**

```javascript
// في services/shipsy-service.js
const response = await this.client.post(
  "/api/customer/integration/consignment/upload/softdata/v2",
  payload
);
```

### Shopify API Integration

**WooCommerce:**

```php
// استخدام WooCommerce functions مباشرة
$order = wc_get_order($order_id);
$order->update_status('completed');
```

**Shopify:**

```javascript
// استخدام Shopify REST API
const response = await this.client.put(`/orders/${orderId}.json`, {
  order: { id: orderId, note: note },
});
```

## الأداء والقابلية للتوسع

### WooCommerce

- ✅ أداء جيد للمتاجر الصغيرة والمتوسطة
- ✅ لا تكاليف استضافة إضافية
- ❌ أداء ضعيفة مع آلاف الطلبات
- ❌ محدود بموارد الخادم المشترك

### Shopify

- ✅ أداء ممتازة حتى مع ملايين الطلبات
- ✅ قابل للتوسع بسهولة
- ✅ دعم load balancing
- ❌ تكاليف استضافة إضافية
- ❌ إعداد أكثر تعقيداً

## الخطوات التالية

### المرحلة الأولى (الأساسيات)

- ✅ البنية الأساسية
- ✅ التكامل مع API
- ✅ المزامنة الأساسية
- ✅ لوحة التحكم البسيطة

### المرحلة الثانية (التحسينات)

- ⏳ معالجة الأخطاء المتقدمة
- ⏳ Caching و optimization
- ⏳ تقارير متقدمة
- ⏳ دعم لغات متعددة

### المرحلة الثالثة (الميزات المتقدمة)

- ⏳ تكامل مع منصات أخرى (Wix, BigCommerce)
- ⏳ تطبيق موبايل
- ⏳ واجهة مستخدم متقدمة
- ⏳ تحليلات وتقارير شاملة

## الدعم والمساعدة

### الموارد المتاحة

- [Shopify API Documentation](https://shopify.dev/api/admin-rest)
- [Shipsy API Documentation](https://docs.shipsy.io)
- [Node.js Documentation](https://nodejs.org/docs)

### حل المشاكل الشائعة

**مشكلة: الأوامر لا تتزامن**

- تحقق من مفاتيح API
- تأكد من صحة البيانات المرسلة
- شاهد السجلات في `logs/app.log`

**مشكلة: Webhook لا يعمل**

- تحقق من أن التطبيق يستقبل الطلبات
- تأكد من إضافة Webhook في Shopify
- فعّل mode debug في الإعدادات

## الترخيص والملكية

- **الترخيص**: GPL-2.0+
- **الناشر**: Shipsy Plugins
- **السنة**: 2024

---

**آخر تحديث**: يناير 2024
**الإصدار**: 1.0.0
