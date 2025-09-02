# 🎮 Otakon AI - Your Gaming Companion

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## 🚀 **What is Otakon?**

**Otakon AI** is your spoiler-free gaming companion that provides intelligent hints, progress tracking, and AI-powered assistance without ruining your gaming experience.

### **✨ Key Features**
- **🎯 Spoiler-Free Hints** - Get help without spoilers
- **📸 Screenshot Analysis** - Upload game screenshots for AI insights
- **🎮 Progress Tracking** - Monitor your achievements and objectives
- **💻 PC Integration** - Connect with desktop client for seamless gameplay
- **🌐 Global Content Cache** - 90%+ reduction in API calls
- **📊 Smart Analytics** - Comprehensive user behavior tracking

## 🏃‍♂️ **Quick Start**

### **Prerequisites**
- Node.js 18+
- Supabase account
- Gemini API key

### **Installation**
```bash
# Clone the repository
git clone https://github.com/your-username/otakon.git
cd otakon

# Install dependencies
npm install

# Set up environment variables
cp docs/extras/env-example.txt .env.local
# Edit .env.local with your API keys

# Start development server
npm run dev
```

## 📚 **Documentation**

**📖 [Complete Documentation Hub](docs/README.md)**

Our comprehensive documentation is organized into logical sections:

- **🗄️ [Database Schemas](docs/schemas/)** - All database schemas and migrations
- **📊 [Analytics System](docs/analytics/)** - User behavior and performance tracking
- **⚙️ [Implementation Guides](docs/implementation/)** - Step-by-step feature implementation
- **🚀 [Performance & Optimization](docs/performance/)** - Performance tuning strategies
- **🔧 [Setup & Configuration](docs/setup/)** - Complete setup guides
- **📋 [Additional Resources](docs/extras/)** - Configuration templates

### **🚀 Quick Setup Guide**
1. **[Supabase Setup](docs/setup/01-supabase-setup.md)** - Database configuration
2. **[Base Schema](docs/schemas/01-base-schema.sql)** - Core database tables
3. **[Core Analytics](docs/analytics/01-core-analytics.md)** - User tracking system
4. **[Performance Guide](docs/performance/01-optimization-guide.md)** - Optimization strategies

## 🏗️ **Architecture**

### **Frontend**
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **Vite** for fast development and builds
- **PWA** support with service worker

### **Backend**
- **Supabase** for database and authentication
- **PostgreSQL** with Row Level Security
- **Real-time subscriptions** for live updates
- **Edge Functions** for serverless operations

### **AI Integration**
- **Google Gemini** for intelligent responses
- **Global Content Cache** for reduced API calls
- **Game Knowledge Database** for accurate answers
- **Smart Content Rotation** for variety

## 📊 **Performance Features**

### **API Call Optimization**
- **Global Content Cache**: 90%+ reduction in API calls
- **Game Knowledge System**: Additional 20-40% reduction
- **Smart Content Rotation**: Prevents repetitive content
- **Intelligent Caching**: 24-hour cache with automatic refresh

### **User Experience**
- **Instant Loading**: Cached content loads immediately
- **Offline Support**: Service worker for offline functionality
- **Responsive Design**: Optimized for all devices
- **Fast Navigation**: Optimized routing and state management

## 🧪 **Testing**

```bash
# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage
```

## 🚀 **Deployment**

### **Build for Production**
```bash
npm run build
npm run preview
```

### **Environment Variables**
```bash
# Required
GEMINI_API_KEY=your_gemini_api_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional
NODE_ENV=production
VITE_APP_ENV=production
```

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guidelines](docs/CONTRIBUTING.md) for details.

### **Development Workflow**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests and documentation
5. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 **Support**

- **📚 Documentation**: [Complete Guides](docs/README.md)
- **🐛 Issues**: [GitHub Issues](https://github.com/your-username/otakon/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/your-username/otakon/discussions)
- **📧 Email**: support@otakon.app

## 🌟 **Star History**

[![Star History Chart](https://api.star-history.com/svg?repos=your-username/otakon&type=Date)](https://star-history.com/#your-username/otakon&Date)

---

<div align="center">

**Built with ❤️ by the Otakon Team**

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/your-username/otakon)
[![Discord](https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/otakon)
[![Twitter](https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://twitter.com/otakon_ai)

</div>
