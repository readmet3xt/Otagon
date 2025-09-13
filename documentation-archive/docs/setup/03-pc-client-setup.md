# Otakon PC Client

The desktop companion app for Otakon AI - your spoiler-free gaming companion.

## 🚀 Features

- **Screenshot Capture**: Instantly capture game screenshots for AI analysis
- **WebSocket Connection**: Real-time communication with your mobile device
- **Hotkey Support**: Customizable shortcuts for quick screenshot capture
- **Cross-Platform**: Works on Windows, macOS, and Linux

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Electron development tools

## 🛠️ Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/readmet3xt/readmet3xt.github.io.git
cd readmet3xt.github.io
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development mode**
   ```bash
   npm run dev
   ```

4. **Build for distribution**
   ```bash
   npm run build
   npm run electron:build
   ```

## 📦 Build Configuration

This project uses **electron-builder** for creating distributable packages. The build configuration is in `electron-builder.json` or `package.json`.

### Build Scripts

- `npm run build` - Build the main application
- `npm run electron:build` - Build distributable packages
- `npm run electron:build:win` - Build Windows packages only
- `npm run electron:build:mac` - Build macOS packages only
- `npm run electron:build:linux` - Build Linux packages only

## 🚀 Automated Releases

This repository uses GitHub Actions for automated builds and releases.

### How It Works

1. **Create a version tag**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **GitHub Actions automatically:**
   - Builds the app for all platforms (Windows, macOS, Linux)
   - Creates a new release with the version number
   - Uploads all built packages
   - Generates release notes

### Release Workflow

The workflow (`.github/workflows/release.yml`) will:
- Build on Windows, macOS, and Linux runners
- Package the app using electron-builder
- Upload artifacts for each platform
- Create a GitHub release with all packages

## 📱 Mobile App Integration

The PC client connects to the Otakon mobile app via WebSocket using a 4-digit connection code.

### Connection Flow

1. **PC Client** generates a 4-digit code
2. **Mobile App** enters the code to establish connection
3. **WebSocket** connection enables real-time communication
4. **Screenshots** are sent from PC to mobile for AI analysis

## 🔧 Configuration

### Environment Variables

Create a `.env` file for local development:

```env
# Development settings
NODE_ENV=development
ELECTRON_IS_DEV=true

# WebSocket settings
WS_PORT=8080
WS_HOST=localhost
```

### Build Settings

The `electron-builder` configuration in `package.json`:

```json
{
  "build": {
    "appId": "com.otakon.pc-client",
    "productName": "Otakon PC Client",
    "directories": {
      "output": "dist"
    },
    "files": [
      "dist/**/*",
      "node_modules/**/*"
    ],
    "win": {
      "target": ["nsis", "portable"]
    },
    "mac": {
      "target": ["dmg", "zip"]
    },
    "linux": {
      "target": ["AppImage", "deb"]
    }
  }
}
```

## 📁 Project Structure

```
readmet3xt.github.io/
├── src/                    # Source code
│   ├── main/              # Main process
│   ├── renderer/           # Renderer process
│   └── shared/             # Shared utilities
├── dist/                   # Built files
├── .github/                # GitHub Actions
│   └── workflows/
│       └── release.yml     # Release workflow
├── package.json            # Dependencies and scripts
└── README.md               # This file
```

## 🚀 Deployment

### Manual Release

1. **Build the app**
   ```bash
   npm run electron:build
   ```

2. **Create a GitHub release**
   - Go to GitHub → Releases → Draft a new release
   - Tag: `v1.0.0` (or your version)
   - Upload built files from `dist/` folder
   - Publish release

### Automated Release

1. **Commit your changes**
   ```bash
   git add .
   git commit -m "Add new feature"
   git push origin main
   ```

2. **Create and push a tag**
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

3. **GitHub Actions will automatically:**
   - Build for all platforms
   - Create the release
   - Upload all packages

## 🔄 Update Process

### For Users

Users can download the latest version from:
- **GitHub Releases**: https://github.com/readmet3xt/readmet3xt.github.io/releases
- **Direct download links** for their platform

### For Developers

1. **Make changes** to the code
2. **Test thoroughly** on all platforms
3. **Create a new tag** with incremented version
4. **Push the tag** to trigger automated build
5. **Review the release** on GitHub

## 🐛 Troubleshooting

### Build Issues

- **Windows**: Ensure you have Visual Studio Build Tools
- **macOS**: Ensure you have Xcode Command Line Tools
- **Linux**: Ensure you have required packages (see electron-builder docs)

### Connection Issues

- **Firewall**: Ensure WebSocket port is open
- **Network**: Check if both devices are on same network
- **Code**: Verify the 4-digit connection code matches

## 📄 License

[Your License Here]

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/readmet3xt/readmet3xt.github.io/issues)
- **Discussions**: [GitHub Discussions](https://github.com/readmet3xt/readmet3xt.github.io/discussions)
- **Documentation**: [Wiki](https://github.com/readmet3xt/readmet3xt.github.io/wiki)

---

**Note**: Remember to update `YOUR_USERNAME` with your actual GitHub username throughout this README.
