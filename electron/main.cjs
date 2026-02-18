/* eslint-disable @typescript-eslint/no-require-imports */
const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const { spawn } = require("node:child_process");
const http = require("node:http");
const net = require("node:net");
const path = require("node:path");
const fs = require("node:fs");
const XLSX = require("xlsx");

const APP_NAME = "Финансы";
const APP_DATA_DIR = "FinanceDesktopData";
const FIXED_PORT = 45117;

// Years to import (2021-2024)
const IMPORT_YEARS = [2021, 2022, 2023, 2024];

let mainWindow = null;
let serverProcess = null;
let serverUrl = null;
let isQuitting = false;

app.setName(APP_NAME);
app.setPath("userData", path.join(app.getPath("appData"), APP_DATA_DIR));

function getServerPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "webapp", "server.js");
  }

  return path.resolve(__dirname, "..", "..", ".next", "standalone", "server.js");
}

function getPreloadPath() {
  return path.join(__dirname, "preload.cjs");
}

function ensurePortAvailable(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.listen(port, "127.0.0.1", () => {
      server.close(() => resolve(port));
    });

    server.on("error", (error) => {
      reject(error);
    });
  });
}

function waitForServer(url, timeoutMs = 30000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const ping = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });

      req.on("error", () => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error("The local app server did not start in time."));
          return;
        }
        setTimeout(ping, 300);
      });
    };

    ping();
  });
}

async function startServer() {
  const serverPath = getServerPath();
  if (!fs.existsSync(serverPath)) {
    throw new Error(
      "Missing web build. Run `npm run build` in the root project first."
    );
  }

  try {
    await ensurePortAvailable(FIXED_PORT);
  } catch {
    throw new Error(
      `Port ${FIXED_PORT} is busy. Close another app using this port and restart desktop app.`
    );
  }

  const port = FIXED_PORT;
  serverUrl = `http://127.0.0.1:${port}`;

  serverProcess = spawn(process.execPath, [serverPath], {
    cwd: path.dirname(serverPath),
    env: {
      ...process.env,
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
      NODE_ENV: "production",
      ELECTRON_RUN_AS_NODE: "1",
    },
    stdio: "ignore",
  });

  serverProcess.on("exit", (code) => {
    if (isQuitting) return;
    if (code === 0) return;

    dialog.showErrorBox(
      "Server Error",
      `The internal web server stopped unexpectedly (code: ${code ?? "unknown"}).`
    );
    app.quit();
  });

  await waitForServer(serverUrl);
}

function stopServer() {
  if (!serverProcess || serverProcess.killed) return;
  serverProcess.kill("SIGTERM");
}

// Convert Excel serial date to JavaScript Date
function excelDateToJSDate(serial) {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  return new Date(utc_value * 1000);
}

// Normalize category names
function normalizeCategory(category) {
  const categoryMap = {
    'Здоровье и красота': 'Здоровье и красота',
    'Питание': 'Питание',
    'Развлечение': 'Развлечение',
    'Транспорт': 'Транспорт',
    'Образование': 'Образование',
    'интернет и связь': 'Интернет и связь',
    'Интернет и связь': 'Интернет и связь',
    'Одежда': 'Одежда',
    'долги': 'Долги',
    'Долги': 'Долги',
    'свое дело, доп вложения': 'Доп. вложения',
    'Доп. Вложения': 'Доп. вложения',
    'Доп. вложения': 'Доп. вложения',
    'непредвиденное, ремонт': 'Непредвиденное',
    'Непредвиденное': 'Непредвиденное',
    'цифровые покупки': 'Цифровые покупки',
    'Цифровые покупки': 'Цифровые покупки',
    'ленивый жор': 'Чрезмерное потребление',
    'чрезмерное потребление': 'Чрезмерное потребление',
    'Чрезмерное потребление': 'Чрезмерное потребление',
    'Покупки в дом, для себя': 'Покупки в дом',
    'Покупки в дом': 'Покупки в дом',
    'Бизнес': 'Бизнес',
    'Фондовый рынок': 'Фондовый рынок',
    'Алименты': 'Алименты',
    'Девушка': 'Девушка',
    'ЖКХ': 'ЖКХ',
    'Бытовая химия': 'Бытовая химия',
    'Веркина квартира': 'Другое',
    'зарплата': 'Зарплата',
    'Зарплата': 'Зарплата',
    'подработка': 'Подработка',
    'Подработка': 'Подработка',
    'дивиденды и купоны': 'Дивиденды и купоны',
    'Дивиденды и купоны': 'Дивиденды и купоны',
    'ДОЛГИ': 'Другое',
    'Другое': 'Другое',
  };
  
  return categoryMap[category] || category;
}

// Parse Excel file and return transactions
function parseExcelFile(filePath) {
  const workbook = XLSX.readFile(filePath);
  const transactions = [];
  let idCounter = 1;

  // Process Expenses sheet
  if (workbook.SheetNames.includes('Расходы')) {
    const expensesSheet = workbook.Sheets['Расходы'];
    const expensesData = XLSX.utils.sheet_to_json(expensesSheet, { header: 1 });
    
    // Find the header row (Дата, Категория, Сумма, Описание)
    let headerRowIndex = -1;
    for (let i = 0; i < expensesData.length; i++) {
      const row = expensesData[i];
      if (row && row[0] === 'Дата' && row[1] === 'Категория') {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex >= 0) {
      for (let i = headerRowIndex + 1; i < expensesData.length; i++) {
        const row = expensesData[i];
        if (row && row.length >= 3 && typeof row[0] === 'number' && typeof row[2] === 'number') {
          const dateSerial = row[0];
          const category = String(row[1] || '').trim();
          const amount = Math.abs(Number(row[2]));
          const description = String(row[3] || '').trim();

          if (category && amount > 0) {
            const date = excelDateToJSDate(dateSerial);
            const year = date.getFullYear();
            
            // Only import transactions from years 2021-2024
            if (IMPORT_YEARS.includes(year)) {
              transactions.push({
                id: `import-exp-${idCounter++}`,
                type: 'expense',
                category: normalizeCategory(category),
                amount,
                date: date.toISOString().split('T')[0],
                description,
              });
            }
          }
        }
      }
    }
  }

  // Process Income sheet
  if (workbook.SheetNames.includes('Доходы')) {
    const incomeSheet = workbook.Sheets['Доходы'];
    const incomeData = XLSX.utils.sheet_to_json(incomeSheet, { header: 1 });
    
    // Find the header row
    let headerRowIndex = -1;
    for (let i = 0; i < incomeData.length; i++) {
      const row = incomeData[i];
      if (row && row[0] === 'Дата' && row[1] === 'Категория') {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex >= 0) {
      for (let i = headerRowIndex + 1; i < incomeData.length; i++) {
        const row = incomeData[i];
        if (row && row.length >= 3 && typeof row[0] === 'number' && typeof row[2] === 'number') {
          const dateSerial = row[0];
          const category = String(row[1] || '').trim();
          const amount = Math.abs(Number(row[2]));
          const description = String(row[3] || '').trim();

          if (category && amount > 0) {
            const date = excelDateToJSDate(dateSerial);
            const year = date.getFullYear();
            
            // Only import transactions from years 2021-2024
            if (IMPORT_YEARS.includes(year)) {
              transactions.push({
                id: `import-inc-${idCounter++}`,
                type: 'income',
                category: normalizeCategory(category),
                amount,
                date: date.toISOString().split('T')[0],
                description,
              });
            }
          }
        }
      }
    }
  }

  // Sort by date descending
  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Get years statistics
  const years = [...new Set(transactions.map(t => new Date(t.date).getFullYear()))].sort();

  return {
    transactions,
    count: transactions.length,
    years,
  };
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 980,
    minHeight: 700,
    title: APP_NAME,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: getPreloadPath(),
    },
  });

  mainWindow.loadURL(serverUrl);
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle('select-excel-file', async () => {
  if (!mainWindow) return { success: false, error: 'Window not available' };

  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Выберите файл Excel',
    filters: [
      { name: 'Excel Files', extensions: ['xlsx', 'xls'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile']
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, canceled: true };
  }

  try {
    const filePath = result.filePaths[0];
    const data = parseExcelFile(filePath);
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
});

const lock = app.requestSingleInstanceLock();
if (!lock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(async () => {
    try {
      await startServer();
      createWindow();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dialog.showErrorBox("Startup Error", message);
      app.quit();
    }
  });
}

app.on("activate", () => {
  if (!mainWindow && serverUrl) {
    createWindow();
  }
});

app.on("before-quit", () => {
  isQuitting = true;
  stopServer();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
