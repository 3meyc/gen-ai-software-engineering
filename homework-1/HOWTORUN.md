# ▶️ How to Run the Application

Follow these steps to set up and run the Banking Transactions API.

## 📋 Prerequisites

- **Node.js**: Version 18 or higher (LTS recommended)
- **npm**: Usually comes with Node.js

## 🛠️ Installation

1. Navigate to the project directory:
   ```bash
   cd homework-1
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## 🚀 Running the API

### Development Mode
Runs the server with `tsx watch`, automatically restarting on file changes:
```bash
npm run dev
```

### Production Mode
Runs the server once:
```bash
npm start
```

Default Port: **3000**
Override Port:
- **Unix/macOS**: `PORT=4000 npm start`
- **Windows (PowerShell)**: `$env:PORT=4000; npm start`
- **Windows (CMD)**: `set PORT=4000&& npm start`

## 🧪 Running Tests

We use **Vitest** for unit and integration testing.

- Run once: `npm test`
- Watch mode: `npm run test:watch`

## 📂 Demo & Testing

You can use the provided demo scripts to test the API:
1. Start the server.
2. Check the `demo/` folder for sample requests.
3. Use `demo/run.sh` (or `.bat`) to execute a sequence of sample calls.