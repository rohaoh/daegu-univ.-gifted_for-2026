const { app, BrowserWindow, ipcMain, safeStorage, Notification } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { SerialPort } = require('serialport');

app.setName('Roomly');
const MODEL = 'gemini-3.8-flash';
let mainWindow;
let serialPort;
let sensorHistory = [];
const DEFAULT_THRESHOLDS = Object.freeze({ temperatureMin: 18, temperatureMax: 28, humidityMin: 30, humidityMax: 65 });
let thresholds = { ...DEFAULT_THRESHOLDS };
let savedReports = [];
let lastDailyReportDate = '';
let saveTimer;

const dataPath = () => path.join(app.getPath('userData'), 'room-data.json');
const keyPath = () => path.join(app.getPath('userData'), 'gemini-key.bin');

function readStore() {
  try {
    const parsed = JSON.parse(fs.readFileSync(dataPath(), 'utf8'));
    sensorHistory = Array.isArray(parsed.sensorHistory) ? parsed.sensorHistory : [];
    thresholds = { ...thresholds, ...(parsed.thresholds || {}) };
    savedReports = Array.isArray(parsed.savedReports) ? parsed.savedReports : [];
    lastDailyReportDate = parsed.lastDailyReportDate || '';
  } catch { /* First launch or an empty local store. */ }
}

function writeStore() {
  try {
    fs.mkdirSync(app.getPath('userData'), { recursive: true });
    fs.writeFileSync(dataPath(), JSON.stringify({ sensorHistory, thresholds, savedReports, lastDailyReportDate }, null, 2));
  } catch (error) { console.error('Could not save local sensor data:', error.message); }
}

function saveStore() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(writeStore, 300);
}

function send(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(channel, payload);
}

function parseSensorLine(line) {
  const clean = line.trim();
  if (!clean) return null;
  let data;
  try { data = JSON.parse(clean); } catch { data = null; }
  let temperature = data && (data.temperature ?? data.temp ?? data.t);
  let humidity = data && (data.humidity ?? data.hum ?? data.h);
  if (temperature == null || humidity == null) {
    const match = clean.match(/(?:T(?:EMP(?:ERATURE)?)?\s*[:=]\s*)?(-?\d+(?:\.\d+)?)\s*[,;\s]+(?:H(?:UM(?:IDITY)?)?\s*[:=]\s*)?(\d+(?:\.\d+)?)/i);
    if (match) [, temperature, humidity] = match;
  }
  temperature = Number(temperature);
  humidity = Number(humidity);
  if (!Number.isFinite(temperature) || !Number.isFinite(humidity) || temperature < -50 || temperature > 100 || humidity < 0 || humidity > 100) return null;
  return { timestamp: new Date().toISOString(), temperature, humidity };
}

function getAlerts(reading) {
  const alerts = [];
  if (reading.temperature < Number(thresholds.temperatureMin)) alerts.push(`온도가 하한 ${thresholds.temperatureMin}°C보다 낮습니다`);
  if (reading.temperature > Number(thresholds.temperatureMax)) alerts.push(`온도가 상한 ${thresholds.temperatureMax}°C보다 높습니다`);
  if (reading.humidity < Number(thresholds.humidityMin)) alerts.push(`습도가 하한 ${thresholds.humidityMin}%보다 낮습니다`);
  if (reading.humidity > Number(thresholds.humidityMax)) alerts.push(`습도가 상한 ${thresholds.humidityMax}%보다 높습니다`);
  return alerts;
}

function addReading(reading) {
  sensorHistory.push(reading);
  if (sensorHistory.length > 100000) sensorHistory = sensorHistory.slice(-100000);
  saveStore();
  const alerts = getAlerts(reading);
  send('sensor:reading', { ...reading, alerts });
  if (alerts.length && Notification.isSupported()) {
    const alertKey = alerts.join('|');
    if (alertKey !== addReading.lastAlertKey || Date.now() - addReading.lastAlertAt > 5 * 60 * 1000) {
      new Notification({ title: '방 환경 기준 알림', body: alerts.join('\n') }).show();
      addReading.lastAlertKey = alertKey;
      addReading.lastAlertAt = Date.now();
    }
  } else addReading.lastAlertKey = '';
}

function summarizePeriod(requestedRange) {
  const now = Date.now();
  const start = requestedRange?.start ? Date.parse(requestedRange.start) : now - 24 * 60 * 60 * 1000;
  const end = requestedRange?.end ? Date.parse(requestedRange.end) : now;
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) throw new Error('분석 시작일과 종료일을 확인해 주세요.');
  const items = sensorHistory.filter(item => {
    const timestamp = Date.parse(item.timestamp);
    return timestamp >= start && timestamp <= end;
  });
  const aggregate = key => {
    if (!items.length) return { average: null, min: null, max: null };
    let total = 0, minimum = Infinity, maximum = -Infinity;
    for (const item of items) {
      const value = Number(item[key]);
      total += value;
      minimum = Math.min(minimum, value);
      maximum = Math.max(maximum, value);
    }
    return { average: +(total / items.length).toFixed(1), min: minimum, max: maximum };
  };
  const temperature = aggregate('temperature');
  const humidity = aggregate('humidity');
  const outside = items.reduce((counts, item) => {
    if (item.temperature < Number(thresholds.temperatureMin) || item.temperature > Number(thresholds.temperatureMax)) counts.temperature++;
    if (item.humidity < Number(thresholds.humidityMin) || item.humidity > Number(thresholds.humidityMax)) counts.humidity++;
    return counts;
  }, { temperature: 0, humidity: 0 });
  return {
    period: requestedRange?.label || '최근 24시간', start: new Date(start).toISOString(), end: new Date(end).toISOString(), sampleCount: items.length,
    temperature: { ...temperature, unit: '°C' },
    humidity: { ...humidity, unit: '%' },
    thresholds, readingsOutsideThreshold: outside,
  };
}

async function analyzeEnvironment(kind = 'manual', requestedRange) {
  if (!fs.existsSync(keyPath())) throw new Error('설정에서 Gemini API 키를 먼저 저장해 주세요.');
  if (!safeStorage.isEncryptionAvailable()) throw new Error('이 Windows 계정에서 안전한 키 저장을 사용할 수 없습니다.');
  const summary = summarizePeriod(kind === 'daily' ? undefined : requestedRange);
  if (!summary.sampleCount) throw new Error(`${summary.period}에 분석할 센서 기록이 없습니다.`);
  const apiKey = safeStorage.decryptString(fs.readFileSync(keyPath()));
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey });
  const result = await ai.models.generateContent({
    model: MODEL,
    contents: `다음은 방의 ${summary.period} 온습도 센서 요약입니다. 한국어로 간결하고 친절하게 평가해 주세요. 관측된 사실, 기준을 벗어난 기록, 추세에서 말할 수 있는 점, 사용자가 확인할 다음 행동을 구분하세요. 데이터가 부족하면 부족하다고 말하세요. 의학적 진단이나 건강을 보장하는 표현은 쓰지 말고, 설정한 환경 기준에 대한 참고 정보라고 밝혀 주세요.\n분석 종류: ${kind}\n자료: ${JSON.stringify(summary)}`,
  });
  const report = { id: `${Date.now()}`, createdAt: new Date().toISOString(), kind, summary, text: result.text || '분석 결과가 비어 있습니다.' };
  savedReports.unshift(report);
  savedReports = savedReports.slice(0, 60);
  saveStore();
  send('ai:report', report);
  return report;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1260, height: 860, minWidth: 920, minHeight: 650, backgroundColor: '#f4f6f8',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  mainWindow.loadFile('index.html');
}

ipcMain.handle('ports:list', async () => {
  const ports = await SerialPort.list();
  return ports.map(port => ({ path: port.path, manufacturer: port.manufacturer || '', friendlyName: port.friendlyName || '', vendorId: port.vendorId || '', productId: port.productId || '' }));
});

ipcMain.handle('serial:connect', async (_event, { path: portPath, baudRate = 9600 }) => {
  if (serialPort?.isOpen) await new Promise(resolve => serialPort.close(() => resolve()));
  if (!portPath) throw new Error('COM 포트를 선택해 주세요.');
  serialPort = new SerialPort({ path: portPath, baudRate: Number(baudRate), autoOpen: false });
  await new Promise((resolve, reject) => serialPort.open(error => error ? reject(error) : resolve()));
  let pending = '';
  serialPort.on('data', chunk => {
    pending += chunk.toString('utf8');
    const lines = pending.split(/\r?\n/);
    pending = lines.pop().slice(-500);
    for (const line of lines) {
      const reading = parseSensorLine(line);
      if (reading) addReading(reading);
    }
  });
  serialPort.on('error', error => send('serial:status', { connected: false, error: error.message }));
  serialPort.on('close', () => send('serial:status', { connected: false }));
  send('serial:status', { connected: true, path: portPath, baudRate: Number(baudRate) });
  return { connected: true, path: portPath, baudRate: Number(baudRate) };
});

ipcMain.handle('serial:disconnect', async () => {
  if (serialPort?.isOpen) await new Promise(resolve => serialPort.close(() => resolve()));
  serialPort = null;
  send('serial:status', { connected: false });
  return true;
});

ipcMain.handle('data:get', () => ({ history: sensorHistory, thresholds, reports: savedReports, latest: sensorHistory.at(-1) || null, hasApiKey: fs.existsSync(keyPath()) }));
ipcMain.handle('thresholds:save', (_event, next) => {
  thresholds = { temperatureMin: Number(next.temperatureMin), temperatureMax: Number(next.temperatureMax), humidityMin: Number(next.humidityMin), humidityMax: Number(next.humidityMax) };
  saveStore();
  return thresholds;
});
ipcMain.handle('thresholds:reset', () => {
  thresholds = { ...DEFAULT_THRESHOLDS };
  saveStore();
  return thresholds;
});
ipcMain.handle('key:save', (_event, value) => {
  const apiKey = String(value || '').trim();
  if (!apiKey) throw new Error('API 키를 입력해 주세요.');
  if (!safeStorage.isEncryptionAvailable()) throw new Error('이 Windows 계정에서 안전한 키 저장을 사용할 수 없습니다.');
  fs.mkdirSync(app.getPath('userData'), { recursive: true });
  fs.writeFileSync(keyPath(), safeStorage.encryptString(apiKey));
  return true;
});
ipcMain.handle('key:clear', () => { try { fs.unlinkSync(keyPath()); } catch {} return true; });
ipcMain.handle('ai:analyze', (_event, range) => analyzeEnvironment('manual', range));

app.whenReady().then(() => {
  readStore();
  createWindow();
  const dailyReview = async () => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (lastDailyReportDate === today || !fs.existsSync(keyPath()) || !sensorHistory.length || new Date().getHours() < 8) return;
    try {
      await analyzeEnvironment('daily');
      lastDailyReportDate = today;
      saveStore();
    } catch (error) { console.error('Daily AI review skipped:', error.message); }
  };
  dailyReview();
  setInterval(dailyReview, 30 * 60 * 1000);
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('before-quit', () => {
  if (serialPort?.isOpen) serialPort.close();
  if (saveTimer) { clearTimeout(saveTimer); writeStore(); }
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
