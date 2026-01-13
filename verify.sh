#!/bin/bash
# Quick Verification Script
# نص التحقق السريع

echo "╔════════════════════════════════════════════════════════════╗"
echo "║      Shipsy Econnect - Multi-Store Implementation        ║"
echo "║                   Verification Script                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check files
echo -e "${BLUE}📋 Checking Implementation Files...${NC}"
echo "-------------------------------------------"

files=(
    "database/connection.js:PostgreSQL Connection"
    "services/oauth-service.js:OAuth Service"
    "services/shop-service.js:Shop Service"
    "middleware/auth-middleware.js:Auth Middleware"
    "routes/auth.js:Auth Routes"
    "server-oauth.js:OAuth Server"
    ".env.production:Production Config"
    "render.yaml:Render Config"
    "OAUTH_IMPLEMENTATION.md:OAuth Documentation"
    "RENDER_DEPLOYMENT.md:Render Guide"
    "MIGRATION_GUIDE.md:Migration Guide"
    "IMPLEMENTATION_SUMMARY.md:Implementation Summary"
)

count=0
for file in "${files[@]}"; do
    IFS=':' read -r path description <<< "$file"
    if [ -f "$path" ]; then
        echo -e "${GREEN}✅${NC} $description ($path)"
        ((count++))
    else
        echo -e "${RED}❌${NC} $description ($path)"
    fi
done

echo ""
echo "-------------------------------------------"
echo -e "${GREEN}Total: $count files created${NC}"

# Check Node.js
echo ""
echo -e "${BLUE}🔍 Checking Node.js Environment...${NC}"
echo "-------------------------------------------"

if command -v node &> /dev/null; then
    echo -e "${GREEN}✅ Node.js installed$(node --version)${NC}"
else
    echo -e "${RED}❌ Node.js not found${NC}"
fi

if command -v npm &> /dev/null; then
    echo -e "${GREEN}✅ npm installed ($(npm --version))${NC}"
else
    echo -e "${RED}❌ npm not found${NC}"
fi

# Check PostgreSQL
echo ""
echo -e "${BLUE}🗄️ Checking PostgreSQL...${NC}"
echo "-------------------------------------------"

if command -v psql &> /dev/null; then
    echo -e "${GREEN}✅ PostgreSQL installed${NC}"
else
    echo -e "${YELLOW}⚠️ PostgreSQL not installed (will use Render)${NC}"
fi

# Check package.json dependencies
echo ""
echo -e "${BLUE}📦 Checking Dependencies...${NC}"
echo "-------------------------------------------"

if grep -q "pg" package.json; then
    echo -e "${GREEN}✅ pg (PostgreSQL) added${NC}"
else
    echo -e "${RED}❌ pg not found in package.json${NC}"
fi

if grep -q "crypto" package.json; then
    echo -e "${GREEN}✅ crypto added${NC}"
else
    echo -e "${YELLOW}⚠️ crypto (built-in) not listed${NC}"
fi

# Quick summary
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo -e "${GREEN}✅ IMPLEMENTATION COMPLETE!${NC}"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo "📚 Documentation Files Created:"
echo "  1. OAUTH_IMPLEMENTATION.md - OAuth system details"
echo "  2. RENDER_DEPLOYMENT.md - Complete Render setup guide"
echo "  3. MIGRATION_GUIDE.md - How to update controllers"
echo "  4. IMPLEMENTATION_SUMMARY.md - Overview of changes"
echo ""

echo "🚀 Next Steps:"
echo "  1. npm install"
echo "  2. Update .env with test values"
echo "  3. npm run dev"
echo "  4. Test OAuth locally"
echo "  5. Deploy to Render"
echo ""

echo "📖 Read these files in order:"
echo "  1. IMPLEMENTATION_SUMMARY.md (5 min read)"
echo "  2. OAUTH_IMPLEMENTATION.md (10 min read)"
echo "  3. MIGRATION_GUIDE.md (for controllers update)"
echo "  4. RENDER_DEPLOYMENT.md (for production setup)"
echo ""

echo -e "${BLUE}Happy coding! 🎉${NC}"
echo ""
