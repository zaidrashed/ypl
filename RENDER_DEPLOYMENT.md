# 🚀 نشر على Render - دليل شامل

## المتطلبات الأساسية:

- حساب GitHub مع مستودع المشروع
- حساب Render.com (مجاني)
- بيانات Shopify API
- بيانات Shipsy API

---

## الخطوة 1: تحضير Shopify App

### 1.1 إنشاء Shopify App

```bash
# في لوحة Shopify Partner:
1. اذهب إلى: https://partners.shopify.com
2. اختر: "Create an app" → "Create app manually"
3. اختر: "Distribution" → "Public" (إذا كنت تريد نشره)
4. اسم التطبيق: "Shipsy Econnect"
```

### 1.2 الحصول على API Credentials

```
1. في تطبيقك على Shopify Partners:
   - اذهب إلى: Configuration
   - اختر: "API Credentials"

2. تحت "Admin API access scopes":
   ✅ write_orders
   ✅ read_orders
   ✅ write_fulfillments
   ✅ read_fulfillments

3. اضغط "Save"

4. انسخ:
   - Client ID (SHOPIFY_API_KEY)
   - Client Secret (SHOPIFY_API_SECRET)
```

### 1.3 تعيين Redirect URI (قبل نشر على Render)

```
في Configuration → API Credentials:

Redirect URIs:
https://your-app-name.onrender.com/api/auth/callback

(ستحصل على النطاق بعد إنشاء Render Web Service)
```

---

## الخطوة 2: إعداد PostgreSQL على Render

### 2.1 إنشاء قاعدة بيانات

```bash
1. تسجيل الدخول إلى: https://render.com

2. اضغط على: "+ New" في الأعلى

3. اختر: "PostgreSQL"

4. اختر: "Free" (مجاني للبداية)

5. ملء البيانات:
   Name: shipsy-econnect-db
   Database: shipsy_econnect
   User: avnadmin
   Region: اختر الأقرب
   PostgreSQL Version: 15

6. اضغط: "Create Database"
```

### 2.2 نسخ بيانات الاتصال

```
بعد إنشاء Database، سترى:
- Internal Database URL
- External Database URL

احفظها - ستحتاجها في الخطوة التالية:
Host: postgres-xxxxxx.c.aivencloud.com
Port: 13039
User: avnadmin
Password: xxxxxxxxx
Database: shipsy_econnect
```

---

## الخطوة 3: نشر Web Service على Render

### 3.1 ربط GitHub

```bash
1. اضغط: "+ New" → "Web Service"

2. اختر: "Build and deploy from a Git repository"

3. اختر: "Connect a new repository"
   - سجل دخولك إلى GitHub
   - اختر: shipsy-econnect-shopify

4. اضغط: "Connect"
```

### 3.2 إعدادات Web Service

```
Name: shipsy-econnect-shopify

Environment: Node

Build Command:
npm install

Start Command:
npm start

Branch: main

Auto-deploy: On

Plan: Free
```

### 3.3 إضافة متغيرات البيئة

```bash
اضغط: "Environment" وأضف هذه المتغيرات:

# Shopify Configuration
SHOPIFY_API_KEY = your_api_key
SHOPIFY_API_SECRET = your_api_secret
HOST = https://shipsy-econnect-shopify.onrender.com
REDIRECT_URI = https://shipsy-econnect-shopify.onrender.com/api/auth/callback

# Database Configuration
DB_HOST = postgres-xxxxxx.c.aivencloud.com
DB_PORT = 13039
DB_USER = avnadmin
DB_PASSWORD = your_database_password
DB_NAME = shipsy_econnect

# Shipsy Configuration
SHIPSY_BASE_URL = https://yemenapi.shipsy.io
SHIPSY_API_KEY = your_shipsy_api_key
SHIPSY_ORGANISATION = your_organisation_name

# App Configuration
NODE_ENV = production
PORT = 3000
INTERNAL_API_KEY = generate_random_string_here
```

### 3.4 نشر التطبيق

```bash
اضغط: "Create Web Service"

انتظر حتى ينتهي البناء والنشر:
✅ Build successful
✅ Deployment successful

الرابط الخاص بك:
https://shipsy-econnect-shopify.onrender.com
```

---

## الخطوة 4: تحديث Shopify App Configuration

الآن بعد أن حصلت على رابط Render:

```bash
في Shopify Partner Dashboard:
1. اذهب إلى تطبيقك
2. Configuration
3. API Credentials

غير Redirect URI إلى:
https://shipsy-econnect-shopify.onrender.com/api/auth/callback

اضغط: "Save"
```

---

## الخطوة 5: اختبار النظام

### 5.1 اختبار صحة الخادم

```bash
curl https://shipsy-econnect-shopify.onrender.com/health

Response:
{
  "status": "healthy",
  "timestamp": "2024-01-13T10:30:00Z",
  "environment": "production"
}
```

### 5.2 اختبار OAuth

```bash
curl -X POST https://shipsy-econnect-shopify.onrender.com/api/auth \
  -H "Content-Type: application/json" \
  -d '{
    "shop": "example.myshopify.com"
  }'

Response:
{
  "success": true,
  "authUrl": "https://example.myshopify.com/admin/oauth/authorize?...",
  "state": "random_state"
}
```

### 5.3 تثبيت التطبيق على متجر تجريبي

```
1. اذهب إلى: https://shipsy-econnect-shopify.onrender.com
2. أدخل: your-test-store.myshopify.com
3. اضغط: "Install"
4. وافق على الصلاحيات
5. سيتم إعادة التوجيه للداشبورد
```

---

## الخطوة 6: مراقبة التطبيق

### 6.1 عرض السجلات

```bash
في Render Dashboard:
1. اختر Web Service: shipsy-econnect-shopify
2. اذهب إلى: "Logs"
3. شاهد السجلات الحية
```

### 6.2 إدارة قاعدة البيانات

```bash
للاتصال بـ PostgreSQL مباشرة:

psql -h postgres-xxxxxx.c.aivencloud.com \
     -p 13039 \
     -U avnadmin \
     -d shipsy_econnect

ثم جرب:
SELECT * FROM shops;
SELECT * FROM sync_logs;
```

---

## المشاكل الشائعة والحل

### ❌ "Build failed"

```
التحقق من:
1. npm install يعمل محلياً
2. لا توجد أخطاء في syntax
3. جميع المتغيرات مضافة في البيئة
```

### ❌ "Database connection error"

```
التحقق من:
1. DB_HOST, DB_PORT صحيحة
2. DB_USER, DB_PASSWORD صحيحة
3. فايروول السماح بالاتصال من Render
```

### ❌ "Invalid HMAC signature"

```
التحقق من:
1. SHOPIFY_API_SECRET صحيح تماماً
2. لا توجد مسافات إضافية
```

### ❌ "Shop not found"

```
التحقق من:
1. المتجر مثبت عليه التطبيق
2. الاتصال بـ API يعمل
3. لا توجد أخطاء في قاعدة البيانات
```

---

## 📈 التحسينات المستقبلية

- [ ] إضافة نظام الدفع (Stripe)
- [ ] لوحة تحكم متقدمة
- [ ] تقارير وتحليلات
- [ ] دعم العملاء
- [ ] نظام الإخطارات
- [ ] تكامل مع منصات أخرى

---

## 🔒 نصائح الأمان

1. **استخدم HTTPS دائماً** ✅
2. **لا تعرّض التوكنات** في Git ✅
3. **استخدم .env.production** ✅
4. **قم بتدوير المفاتيح بانتظام** ✅
5. **راقب السجلات للأنشطة المريبة** ✅

---

## 📞 دعم Render

- الوثائق: https://render.com/docs
- الدعم: support@render.com
- المشروع: https://dashboard.render.com

---

**تاريخ التحديث:** 13 يناير 2024
**الإصدار:** 2.0.0
