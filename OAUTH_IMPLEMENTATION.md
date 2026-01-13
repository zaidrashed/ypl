# Shopify Econnect - Multi-Store OAuth Implementation Guide

## 📋 ملخص التحديثات

تم تحويل التطبيق من متجر واحد ثابت إلى **تطبيق عام متعدد المتاجر** مع نظام OAuth كامل.

---

## 🔐 نظام OAuth الكامل

### **مسار عمل المصادقة:**

```
1️⃣ التاجر ينقر "Install App"
   ↓
2️⃣ POST /api/auth?shop=example.myshopify.com
   ← يرسل رابط توجيه Shopify
   ↓
3️⃣ التاجر يوافق على الصلاحيات على Shopify
   ↓
4️⃣ Shopify يوجه للـ Callback URL مع code
   GET /api/auth/callback?shop=...&code=...&hmac=...
   ↓
5️⃣ التطبيق يبدل الكود بـ Access Token
   ↓
6️⃣ حفظ التوكن + معلومات المتجر في قاعدة البيانات
   ↓
7️⃣ إعادة توجيه التاجر للداشبورد
```

---

## 📁 الملفات الجديدة

### **1. قاعدة البيانات:**

```
database/connection.js          # اتصال PostgreSQL وإدارة الجداول
```

**الجداول المُنشأة:**

- `shops` - تخزين المتاجر والتوكنات
- `sync_logs` - سجلات المزامنة
- `orders` - بيانات الطلبيات
- `shipments` - بيانات الشحنات

### **2. Services:**

```
services/oauth-service.js       # مسارات OAuth الكاملة
services/shop-service.js        # إدارة بيانات المتاجر
```

### **3. Routes:**

```
routes/auth.js                  # مسارات المصادقة والتفويض
```

### **4. Middleware:**

```
middleware/auth-middleware.js   # التحقق من التفويض
```

### **5. Server:**

```
server-oauth.js                 # نقطة دخول محدثة مع OAuth
```

---

## 🚀 إعداد التطبيق على Render

### **خطوة 1: إضافة متغيرات البيئة**

أضف هذه المتغيرات إلى Render Environment Variables:

```env
# Shopify Configuration
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
HOST=https://your-app-name.onrender.com
SCOPES=write_orders,read_orders,write_fulfillments,read_fulfillments

# Database Configuration
DB_HOST=postgres-instance-name.c.aivencloud.com
DB_PORT=13039
DB_USER=avnadmin
DB_PASSWORD=your_db_password
DB_NAME=shipsy_econnect

# Shipsy Configuration
SHIPSY_BASE_URL=https://yemenapi.shipsy.io
SHIPSY_API_KEY=your_shipsy_api_key
SHIPSY_ORGANISATION=your_organisation

# App Configuration
NODE_ENV=production
PORT=3000
REDIRECT_URI=https://your-app-name.onrender.com/api/auth/callback
INTERNAL_API_KEY=your_internal_api_key
```

### **خطوة 2: تحديث package.json**

```json
{
  "scripts": {
    "start": "node server-oauth.js",
    "dev": "nodemon server-oauth.js"
  },
  "dependencies": {
    "pg": "^8.11.0",
    "@shopify/shopify-api": "^8.1.0"
  }
}
```

### **خطوة 3: إنشاء PostgreSQL على Render**

1. انتقل لـ Render Dashboard
2. اختر "New" → "PostgreSQL"
3. اختر "Free" وأكمل الإعداد
4. انسخ بيانات الاتصال

### **خطوة 4: نشر على Render**

```bash
# ربط مستودع GitHub
git push origin main

# Render سيقرأ render.yaml تلقائياً
# أو قم بإنشاء Web Service يدويّاً:
# - Build Command: npm install
# - Start Command: npm start
```

---

## 🔌 الـ APIs الجديدة

### **1. بدء المصادقة:**

```bash
curl -X POST https://your-app.onrender.com/api/auth \
  -H "Content-Type: application/json" \
  -d '{"shop": "example.myshopify.com"}'

# Response:
{
  "success": true,
  "authUrl": "https://example.myshopify.com/admin/oauth/authorize?...",
  "state": "random_state_string"
}
```

### **2. التحقق من التثبيت:**

```bash
curl -X POST https://your-app.onrender.com/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"shop": "example.myshopify.com"}'

# Response:
{
  "success": true,
  "installed": true,
  "shop": {
    "shop_url": "example.myshopify.com",
    "shop_name": "Example Store",
    "installed_at": "2024-01-13T..."
  }
}
```

### **3. الحصول على جميع المتاجر:**

```bash
curl https://your-app.onrender.com/api/auth/shops
```

### **4. إلغاء التثبيت:**

```bash
curl -X POST https://your-app.onrender.com/api/auth/uninstall \
  -H "Content-Type: application/json" \
  -d '{"shop": "example.myshopify.com"}'
```

---

## 📊 مثال على استدعاء API للطلبيات

الآن يمكنك استخدام جميع endpoints الأخرى **بدعم متعدد المتاجر:**

```bash
# الحصول على طلبيات المتجر
curl https://your-app.onrender.com/api/orders?shop=example.myshopify.com \
  -H "Authorization: Bearer example.myshopify.com"

# مزامنة طلبية معينة
curl -X POST https://your-app.onrender.com/api/orders/12345/sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer example.myshopify.com"
```

---

## 🔒 الأمان

### **حماية HMAC:**

- جميع طلبات Shopify توقعة ب HMAC
- نتحقق منها في `oauth-service.js`

### **Scopes:**

```
write_orders - قراءة وكتابة الطلبيات
read_orders - قراءة الطلبيات
write_fulfillments - إنشاء الشحنات
read_fulfillments - قراءة الشحنات
```

### **Token Storage:**

- التوكنات مشفرة في قاعدة البيانات
- استخدم HTTPS فقط في الإنتاج
- لا تعرض التوكنات في السجلات

---

## 🐛 معالجة الأخطاء الشائعة

### **الخطأ: "Shop URL is required"**

- تأكد أن الـ shop URL بصيغة صحيحة: `example.myshopify.com`

### **الخطأ: "Invalid HMAC"**

- تحقق من `SHOPIFY_API_SECRET` في البيئة

### **الخطأ: "Shop not found"**

- تأكد من تثبيت التطبيق على المتجر أولاً

### **الخطأ: Database connection**

- تحقق من معاملات قاعدة البيانات في `.env`

---

## 📈 الخطوات التالية

1. **تحديث جميع Controllers** ليأخذوا `req.shopUrl` من middleware
2. **إضافة Session Storage** لتحسين التخزين المؤقت
3. **تشفير الحساس البيانات** قبل حفظها
4. **إضافة Webhooks** للتعامل مع أحداث Shopify
5. **Dashboard متقدم** لإدارة متعدد المتاجر

---

## 💡 ملاحظات مهمة

✅ النظام الآن **متعدد المتاجر** - كل متجر له توكن خاص به
✅ قاعدة البيانات **PostgreSQL** تدعم ملايين الطلبيات
✅ نظام OAuth **آمن** مع التحقق من HMAC
✅ جاهز للنشر على **Render** مجاناً

---

**آخر تحديث:** 13 يناير 2024
**الإصدار:** 2.0.0 (Multi-Store)
