# تشغيل تطبيق Shopify Econnect

## المتطلبات

- Node.js 18+
- npm أو yarn

## التثبيت والتشغيل

### 1. تثبيت المتعلقات

```bash
npm install
```

### 2. إعداد متغيرات البيئة

نسخ الملف `.env.example` إلى `.env` والقيام بتحريره:

```bash
cp .env.example .env
```

ثم قم بملء المتغيرات التالية:

- `SHOPIFY_API_KEY` - مفتاح API الخاص بـ Shopify
- `SHOPIFY_API_SECRET` - السر الخاص بـ Shopify
- `SHOPIFY_ACCESS_TOKEN` - رمز الوصول إلى متجرك
- `SHOPIFY_STORE` - اسم متجرك (مثل: mystore.myshopify.com)
- `SHIPSY_API_KEY` - مفتاح API الخاص بـ Shipsy
- `SHIPSY_ORGANISATION` - اسم منظمتك في Shipsy
- `HOST` - رابط التطبيق (ngrok URL أو اسم النطاق الخاص بك)

### 3. تشغيل التطبيق

#### في بيئة التطوير

```bash
npm run dev
```

#### في بيئة الإنتاج

```bash
npm run build
npm start
```

## البنية الأساسية

```
shipsy-econnect-shopify/
├── server.js                      # نقطة البداية الرئيسية
├── config/                        # إعدادات التطبيق
├── routes/                        # مسارات API
├── services/                      # الخدمات الرئيسية
├── controllers/                   # متحكمات معالجة الطلبات
├── models/                        # نماذج البيانات
├── middleware/                    # البرامج الوسيطة
├── utils/                         # دوال مساعدة
├── crons/                         # المهام المجدولة
└── views/                         # صفحات الويب
```

## الميزات الرئيسية

### 1. مزامنة الطلبات

- تحويل تلقائي لطلبات Shopify إلى شحنات Shipsy
- مزامنة يدوية وآلية حسب الحاجة

### 2. تحديث الحالة

- متابعة حالة الشحنات تلقائياً
- تحديث حالة الطلبات في Shopify

### 3. لوحة التحكم

- عرض إحصائيات المزامنة
- إدارة الإعدادات بسهولة
- عرض سجل العمليات

### 4. الويب هوكس

- استقبال إشعارات من Shopify عند إنشاء/تحديث الطلبات
- معالجة تلقائية للطلبات الجديدة

## نقاط النهاية (Endpoints)

### طلبات (Orders)

- `GET /api/orders` - الحصول على جميع الطلبات
- `GET /api/orders/:orderId` - الحصول على طلب معين
- `POST /api/orders/:orderId/sync` - مزامنة طلب واحد
- `POST /api/orders/sync-all` - مزامنة جميع الطلبات

### الإعدادات (Settings)

- `GET /api/settings` - الحصول على الإعدادات
- `PUT /api/settings` - تحديث الإعدادات
- `POST /api/settings/test-connection` - اختبار الاتصال

## التطور والتوسع

### إضافة ميزة جديدة

1. أنشئ ملف في المجلد المناسب (service/controller/etc)
2. استخدم الأنماط والهياكل الموجودة
3. أضف المسار في ملف `routes`
4. اختبر الميزة

## استكشاف الأخطاء

### عرض السجلات

```bash
tail -f logs/app.log
```

### مسح السجلات

يمكن حذف ملفات السجل من مجلد `logs/`

## الأمان

- جميع الاتصالات مشفرة باستخدام HTTPS
- المفاتيح والأسرار محفوظة في متغيرات البيئة
- التحقق من توقيع webhooks

## الدعم

للمزيد من المعلومات، زيارة:

- [Shopify API Docs](https://shopify.dev/api/admin-rest)
- [Shipsy Documentation](https://docs.shipsy.io)

## الترخيص

GPL-2.0+
