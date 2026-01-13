# دليل النشر والاستضافة

## خيارات الاستضافة الموصى بها

### 1. Heroku (الأسهل للمبتدئين)

#### الخطوات:

1. **إنشاء حساب Heroku**

```bash
heroku login
```

2. **إنشاء تطبيق**

```bash
heroku create shipsy-econnect-shopify
```

3. **إضافة متغيرات البيئة**

```bash
heroku config:set SHOPIFY_API_KEY=your_key
heroku config:set SHOPIFY_API_SECRET=your_secret
heroku config:set SHIPSY_API_KEY=your_key
# ... إضافة باقي المتغيرات
```

4. **النشر**

```bash
git push heroku main
```

5. **عرض السجلات**

```bash
heroku logs --tail
```

### 2. AWS EC2

#### المتطلبات:

- خادم EC2 (t2.micro يكفي للبداية)
- Security Group مفتوح على port 3000
- Ubuntu 20.04 LTS

#### الخطوات:

1. **الاتصال بالخادم**

```bash
ssh -i your-key.pem ubuntu@your-ip
```

2. **تثبيت Node.js**

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **نسخ التطبيق**

```bash
git clone <repo-url>
cd shipsy-econnect-shopify
npm install
```

4. **إعداد متغيرات البيئة**

```bash
nano .env
# أضف جميع المتغيرات المطلوبة
```

5. **استخدام PM2 لتشغيل التطبيق**

```bash
npm install -g pm2
pm2 start server.js --name "shipsy-app"
pm2 startup
pm2 save
```

6. **إعداد Nginx كـ reverse proxy**

```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/default
```

أضف هذا:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}
```

ثم:

```bash
sudo systemctl restart nginx
```

### 3. DigitalOcean App Platform

#### الخطوات:

1. **دفع الكود إلى GitHub**

```bash
git push origin main
```

2. **اتصال DigitalOcean بـ GitHub**

- اذهب إلى DigitalOcean Apps
- اختر "Create App"
- اختر GitHub repository
- اتبع الخطوات

3. **إضافة متغيرات البيئة**

- في App settings
- أضف جميع متغيرات `.env`

### 4. Google Cloud Run

#### الخطوات:

1. **إنشاء Dockerfile**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

2. **بناء الصورة**

```bash
docker build -t shipsy-app .
```

3. **دفع إلى Google Container Registry**

```bash
docker tag shipsy-app gcr.io/your-project/shipsy-app
docker push gcr.io/your-project/shipsy-app
```

4. **نشر على Cloud Run**

```bash
gcloud run deploy shipsy-app \
  --image gcr.io/your-project/shipsy-app \
  --platform managed \
  --region us-central1 \
  --set-env-vars SHOPIFY_API_KEY=your_key
```

## إعداد HTTPS/SSL

### استخدام Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d your-domain.com
```

### مع Nginx:

```bash
sudo certbot --nginx -d your-domain.com
```

## Monitoring والتنبيهات

### استخدام PM2 Plus (اختياري)

```bash
pm2 plus
```

### استخدام New Relic

```bash
npm install newrelic
```

أضف في بداية `server.js`:

```javascript
require("newrelic");
```

## النسخ الاحتياطية

### نسخ احتياطية تلقائية للسجلات

```bash
# في crontab
0 2 * * * tar -czf /backup/logs-$(date +\%Y\%m\%d).tar.gz /app/logs/
```

## قياس الأداء

### استخدام APM (Application Performance Monitoring)

```bash
# مع New Relic
npm install newrelic

# مع DataDog
npm install dd-trace
```

## خطوات الإطلاق (Launch Checklist)

- ☐ جميع متغيرات البيئة مضبوطة
- ☐ SSL/HTTPS مفعل
- ☐ Domain مشير إلى التطبيق
- ☐ Webhooks مسجلة في Shopify
- ☐ اختبار مزامنة طلب واحد
- ☐ مراقبة السجلات للأخطاء
- ☐ Monitoring مفعل
- ☐ النسخ الاحتياطية مفعلة
- ☐ خطة استجابة الطوارئ جاهزة

## استكشاف الأخطاء

### تحقق من صحة الاتصال

```bash
curl -X GET http://localhost:3000/health
```

### عرض السجلات في الوقت الفعلي

```bash
tail -f logs/app.log | grep ERROR
```

### فحص استخدام الموارد

```bash
pm2 monit
```

## التحديثات والصيانة

### تحديث الكود

```bash
git pull origin main
npm install
pm2 restart shipsy-app
```

### تحديث الحزم

```bash
npm update
npm audit fix
```

## نصائح الإنتاج

1. **استخدم متغيرات البيئة**

   - أبداً لا تحفظ المفاتيح في الكود

2. **فعّل CORS بحذر**

   - حدد النطاقات المسموحة

3. **استخدم Rate Limiting**

   - منع الهجمات على API

4. **سجل جميع العمليات**

   - للتدقيق والمراجعة

5. **احرص على الأمان**
   - استخدم HTTPS دائماً
   - تحقق من توقيع Webhooks
   - استخدم رموز آمنة

## التكاليف التقريبية

| الخدمة           | التكلفة الشهرية       |
| ---------------- | --------------------- |
| Heroku           | $7-50                 |
| AWS EC2          | $5-30                 |
| DigitalOcean     | $4-30                 |
| Google Cloud Run | $0-30 (حسب الاستخدام) |

---

**ملاحظة**: اختر الخيار الذي يناسب احتياجاتك ومستوى خبرتك
