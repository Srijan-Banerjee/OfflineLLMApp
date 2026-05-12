# Offline LLM Chat App

A React Native Android application that runs LLMs locally and offline using `llama.rn` (llama.cpp wrapper).

## Features
- **Local Inference:** No internet required for chatting.
- **Custom Model Support:** Load any `.gguf` model blob from your device storage.
- **Privacy First:** All data stays on your device.

## How to Build the APK
Since building Android apps requires a heavy development environment (Android SDK, NDK, etc.), this project is configured to build automatically using **GitHub Actions**.

1. **Create a GitHub Repository:** Create a new repository on GitHub (e.g., `offline-llm-app`).
2. **Push this code:**
   ```bash
   cd OfflineLLMApp
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/offline-llm-app.git
   git branch -M main
   git push -u origin main
   ```
3. **Wait for Build:** Go to the **Actions** tab in your GitHub repository. You will see a "Build Android APK" workflow running.
4. **Download APK:** Once the workflow finishes, click on the run summary and download the `app-debug.apk` from the **Artifacts** section.
5. **Install:** Transfer the APK to your phone and install it.

## How to Use
1. **Download a Model:** Download a GGUF model (e.g., Gemma 2b or Llama 3 8b quantized) to your phone.
2. **Open App:** Launch "Offline LLM" on your phone.
3. **Load Model:** Tap **Load GGUF** and select the downloaded file.
4. **Chat:** Once loaded, start chatting!

## Technical Details
- **Engine:** `llama.cpp` via `llama.rn`.
- **UI:** React Native with TypeScript.
- **Format:** Supports GGUF (quantized models recommended for mobile, e.g., Q4_K_M).
