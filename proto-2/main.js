const { app, BrowserWindow, ipcMain, Notification, shell, safeStorage } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { SerialPort } = require('serialport');

// Paste the Gemini API key here before building the app. This key is extractable from distributed desktop apps.
const GEMINI_API_KEY = "AQ.Ab8RN6J-7Bhvvc6OXdUBkUNvlwynE355eUAQKXGIJqQfYapZNA";
const GEMINI_MODEL = 'gemini-3.8-flash';
let aiClient;

app.setName('Roomly');
if (process.platform === 'win32') {
  app.setAppUserModelId('com.ohroha.roomly');
  app.setToastActivatorCLSID('{A8C6FEA4-7E55-4C7B-9BA2-30E9A0B4F21D}');
}
let mainWindow;
let serialPort;
let sensorHistory = [];
const DEFAULT_THRESHOLDS = Object.freeze({ temperatureMin: 18, temperatureMax: 28, humidityMin: 30, humidityMax: 65, gasRawMax: 700, lightLuxLimit: 100, lightLuxDirection: 'below' });
let thresholds = { ...DEFAULT_THRESHOLDS };
let lightCalibration = { fixedResistorOhms: 10000, resistanceAt10LuxOhms: 15000, gamma: 0.7, wiring: 'ldr-high' };
const DEFAULT_KMA_SERVICE_KEY = '4f8111d6fc0a9521e2b4f2efd81791cb3863e54c52c01bc279a1c2fffe851404';
let weatherSettings = { nx: 60, ny: 127, stnId: 108, region: '서울', apiKey: DEFAULT_KMA_SERVICE_KEY };
let weatherSnapshot = { weather: null, advisories: [], error: '기상청 API 키를 설정해 주세요.' };
let savedReports = [];
let lastDailyReportDate = '';
let saveTimer;

const dataPath = () => path.join(app.getPath('userData'), 'room-data.json');

function readStore() {
  try {
    const parsed = JSON.parse(fs.readFileSync(dataPath(), 'utf8'));
    sensorHistory = Array.isArray(parsed.sensorHistory) ? parsed.sensorHistory : [];
    thresholds = { ...thresholds, ...(parsed.thresholds || {}) };
    lightCalibration = { ...lightCalibration, ...(parsed.lightCalibration || {}) };
    savedReports = Array.isArray(parsed.savedReports) ? parsed.savedReports : [];
    lastDailyReportDate = parsed.lastDailyReportDate || '';
    weatherSettings = { ...weatherSettings, ...(parsed.weatherSettings || {}) };
    if (parsed.weatherKey && safeStorage.isEncryptionAvailable()) weatherSettings.apiKey = safeStorage.decryptString(Buffer.from(parsed.weatherKey, 'base64'));
    sensorHistory = sensorHistory.map(item => item.lightRaw == null ? item : { ...item, lightLux: estimateLux(item.lightRaw) });
  } catch { /* First launch or an empty local store. */ }
}

function writeStore() {
  try {
    fs.mkdirSync(app.getPath('userData'), { recursive: true });
    const storedWeather = { ...weatherSettings, apiKey: undefined };
    const weatherKey = weatherSettings.apiKey && safeStorage.isEncryptionAvailable() ? safeStorage.encryptString(weatherSettings.apiKey).toString('base64') : '';
    fs.writeFileSync(dataPath(), JSON.stringify({ sensorHistory, thresholds, savedReports, lastDailyReportDate, weatherSettings: storedWeather, weatherKey, lightCalibration }, null, 2));
  } catch (error) { console.error('Could not save local sensor data:', error.message); }
}

function saveStore() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(writeStore, 300);
}

function send(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(channel, payload);
}

function estimateLux(adc) {
  const value = Math.max(1, Math.min(1022, Number(adc)));
  const fixed = Number(lightCalibration.fixedResistorOhms) || 10000;
  const ldrResistance = lightCalibration.wiring === 'ldr-low'
    ? fixed * value / (1023 - value)
    : fixed * (1023 - value) / value;
  const r10 = Number(lightCalibration.resistanceAt10LuxOhms) || 15000;
  const gamma = Math.max(0.3, Math.min(1.2, Number(lightCalibration.gamma) || 0.7));
  const lux = 10 * Math.pow(ldrResistance / r10, -1 / gamma);
  return Number.isFinite(lux) ? Math.max(0, Math.min(200000, lux)) : null;
}

function parseSensorLine(line) {
  const clean = line.trim();
  if (!clean) return null;
  let data;
  try { data = JSON.parse(clean); } catch { data = null; }
  let temperature = data && (data.temperature ?? data.temp ?? data.t);
  let humidity = data && (data.humidity ?? data.hum ?? data.h);
  let gas = data && (data.gasRaw ?? data.gas ?? data.gasValue ?? data.gas_raw);
  let light = data && (data.lightRaw ?? data.light ?? data.lightLevel ?? data.lightValue ?? data.cdsValue ?? data.ldr ?? data.ldrValue ?? data.brightness ?? data.illuminanceRaw);
  if (temperature == null || humidity == null) {
    const match = clean.match(/(?:T(?:EMP(?:ERATURE)?)?\s*[:=]\s*)?(-?\d+(?:\.\d+)?)\s*[,;\s]+(?:H(?:UM(?:IDITY)?)?\s*[:=]\s*)?(\d+(?:\.\d+)?)/i);
    if (match) [, temperature, humidity] = match;
    const parts = clean.split(/[,;\s]+/);
    if (gas == null && parts.length >= 3 && Number.isFinite(Number(parts[2]))) gas = parts[2];
    if (light == null && parts.length >= 4 && Number.isFinite(Number(parts[3]))) light = parts[3];
  }
  temperature = Number(temperature);
  humidity = Number(humidity);
  if (!Number.isFinite(temperature) || !Number.isFinite(humidity) || temperature < -50 || temperature > 100 || humidity < 0 || humidity > 100) return null;
  const reading = { timestamp: new Date().toISOString(), temperature, humidity };
  if (gas != null && Number.isFinite(Number(gas)) && Number(gas) >= 0 && Number(gas) <= 1023) reading.gasRaw = Number(gas);
  if (light != null && Number.isFinite(Number(light)) && Number(light) >= 0 && Number(light) <= 1023) {
    reading.lightRaw = Number(light);
    reading.lightLux = estimateLux(reading.lightRaw);
  }
  return reading;
}

async function requestKma(url, key, params = {}) {
  const parsed = new URL(url);
  parsed.searchParams.set('serviceKey', key);
  parsed.searchParams.set('dataType', 'JSON');
  for (const [name, value] of Object.entries(params)) parsed.searchParams.set(name, String(value));
  const response = await fetch(parsed, { signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`기상청 응답 오류 (${response.status})`);
  const body = await response.json();
  const result = body.response;
  if (result?.header?.resultCode !== '00') throw new Error(result?.header?.resultMsg || '기상청 API 요청에 실패했습니다.');
  return result.body?.items?.item || [];
}

async function refreshWeather() {
  if (!weatherSettings.apiKey) return;
  try {
    const now = new Date();
    const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now).replaceAll('-', '');
    const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', hour: '2-digit', hour12: false }).format(now));
    const baseHour = Math.floor((hour - 1) / 3) * 3;
    const baseTime = hour < 2 ? '2300' : `${String(baseHour).padStart(2, '0')}00`;
    const baseDate = hour < 2 ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now.getTime() - 86400000)).replaceAll('-', '') : date;
    const items = await requestKma('https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst', weatherSettings.apiKey, {
      base_date: baseDate, base_time: baseTime, nx: weatherSettings.nx, ny: weatherSettings.ny,
    });
    const today = items.filter(item => item.fcstDate === date);
    const byCat = category => today.find(item => item.category === category)?.fcstValue;
    const advisoryItems = await requestKma('https://apis.data.go.kr/1360000/WthrWrnInfoService/getPwnStatus', weatherSettings.apiKey).catch(() => []);
    const advisories = advisoryItems.map(item => item).filter(item => JSON.stringify(item).includes(weatherSettings.region));
    const previous = JSON.stringify(weatherSnapshot.advisories);
    weatherSnapshot = { weather: { temperature: byCat('TMP'), min: byCat('TMN'), max: byCat('TMX'), sky: byCat('SKY'), pty: byCat('PTY'), pop: byCat('POP'), date, updatedAt: new Date().toISOString() }, advisories, error: '' };
    send('weather:update', weatherSnapshot);
    const current = JSON.stringify(advisories);
    if (previous !== '[]' && current !== previous && advisories.length && Notification.isSupported()) {
      const message = advisories.slice(0, 2).map(item => item.t1 || item.title || item.t2).filter(Boolean).join('\n');
      new Notification({ title: `Roomly · ${weatherSettings.region} 날씨 알림`, body: message ? `${message.slice(0, 180)}\n기상특보 내용을 확인해 주세요.` : '해당 지역에 기상특보가 발표됐어요. 앱에서 내용을 확인해 주세요.', icon: path.join(__dirname, 'assets', 'roomly.png') }).show();
    }
  } catch (error) {
    weatherSnapshot = { ...weatherSnapshot, error: error.message };
    send('weather:update', weatherSnapshot);
  }
}

function getAlerts(reading) {
  const alerts = [];
  if (reading.temperature < Number(thresholds.temperatureMin)) alerts.push(`온도가 하한 ${thresholds.temperatureMin}°C보다 낮습니다`);
  if (reading.temperature > Number(thresholds.temperatureMax)) alerts.push(`온도가 상한 ${thresholds.temperatureMax}°C보다 높습니다`);
  if (reading.humidity < Number(thresholds.humidityMin)) alerts.push(`습도가 하한 ${thresholds.humidityMin}%보다 낮습니다`);
  if (reading.humidity > Number(thresholds.humidityMax)) alerts.push(`습도가 상한 ${thresholds.humidityMax}%보다 높습니다`);
  if (reading.gasRaw != null && reading.gasRaw >= Number(thresholds.gasRawMax)) alerts.push(`FC-22 가스 센서 원시값 ${reading.gasRaw} (기준 ${thresholds.gasRawMax})`);
  if (reading.lightRaw != null && ((thresholds.lightRawDirection === 'above' && reading.lightRaw > Number(thresholds.lightRawLimit)) || (thresholds.lightRawDirection !== 'above' && reading.lightRaw < Number(thresholds.lightRawLimit)))) alerts.push(`조도 센서 값 ${thresholds.lightRawDirection === 'above' ? '상한 초과' : '하한 미만'} (${reading.lightRaw} raw)`);
  return alerts;
}

function getAlertEvents(reading) {
  const events = [];
  if (reading.temperature < Number(thresholds.temperatureMin)) events.push({ key: 'temperature-low', message: `실내 온도가 낮아요 · 현재 ${Number(reading.temperature).toFixed(1)}°C (설정 ${thresholds.temperatureMin}°C 미만)\n실내 온도를 확인해 주세요.` });
  if (reading.temperature > Number(thresholds.temperatureMax)) events.push({ key: 'temperature-high', message: `실내 온도가 높아요 · 현재 ${Number(reading.temperature).toFixed(1)}°C (설정 ${thresholds.temperatureMax}°C 초과)\n실내 환기나 냉방 상태를 확인해 주세요.` });
  if (reading.humidity < Number(thresholds.humidityMin)) events.push({ key: 'humidity-low', message: `실내가 건조해요 · 현재 습도 ${Number(reading.humidity).toFixed(0)}% (설정 ${thresholds.humidityMin}% 미만)\n가습이나 환기 상태를 확인해 주세요.` });
  if (reading.humidity > Number(thresholds.humidityMax)) events.push({ key: 'humidity-high', message: `실내 습도가 높아요 · 현재 ${Number(reading.humidity).toFixed(0)}% (설정 ${thresholds.humidityMax}% 초과)\n환기 상태를 확인해 주세요.` });
  if (reading.gasRaw != null && reading.gasRaw >= Number(thresholds.gasRawMax)) events.push({ key: 'gas-high', message: `가스 센서 값이 설정 기준을 넘었어요 · ${reading.gasRaw} / ${thresholds.gasRawMax} raw\n주변 상태를 확인해 주세요.` });
  if (reading.lightLux != null && ((thresholds.lightLuxDirection === 'above' && reading.lightLux > Number(thresholds.lightLuxLimit)) || (thresholds.lightLuxDirection !== 'above' && reading.lightLux < Number(thresholds.lightLuxLimit)))) events.push({ key: 'light-out-of-range', message: `주변이 설정한 조도보다 ${thresholds.lightLuxDirection === 'above' ? '밝아요' : '어두워요'} · 약 ${Number(reading.lightLux).toFixed(0)} lux (기준 ${thresholds.lightLuxLimit} lux)\n조명 상태를 확인해 주세요.` });
  return events;
}

function addReading(reading) {
  sensorHistory.push(reading);
  if (sensorHistory.length > 100000) sensorHistory = sensorHistory.slice(-100000);
  saveStore();
  const alertEvents = getAlertEvents(reading);
  const alerts = alertEvents.map(event => event.message);
  send('sensor:reading', { ...reading, alerts });
  const activeKeys = alertEvents.map(event => event.key);
  const previousKeys = addReading.activeAlertKeys || new Set();
  const now = Date.now();
  const newlyActive = alertEvents.filter(({ key }) => !previousKeys.has(key) && now - (addReading.lastNotifiedAt?.get(key) || 0) >= 5 * 60 * 1000);
  addReading.activeAlertKeys = new Set(activeKeys);
  if (newlyActive.length && Notification.isSupported()) {
    new Notification({ title: 'Roomly · 실내 환경 알림', body: newlyActive.map(item => item.message).join('\n\n'), icon: path.join(__dirname, 'assets', 'roomly.png') }).show();
    addReading.lastNotifiedAt ||= new Map();
    for (const { key } of newlyActive) addReading.lastNotifiedAt.set(key, now);
  }
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
  const gasValues = items.filter(item => Number.isFinite(Number(item.gasRaw)));
  const gasRaw = gasValues.length ? {
    average: +(gasValues.reduce((sum, item) => sum + Number(item.gasRaw), 0) / gasValues.length).toFixed(1),
    min: Math.min(...gasValues.map(item => Number(item.gasRaw))),
    max: Math.max(...gasValues.map(item => Number(item.gasRaw))),
  } : null;
  const lightValues = items.filter(item => Number.isFinite(Number(item.lightRaw)));
  const lightRaw = lightValues.length ? {
    average: +(lightValues.reduce((sum, item) => sum + Number(item.lightRaw), 0) / lightValues.length).toFixed(1),
    min: Math.min(...lightValues.map(item => Number(item.lightRaw))),
    max: Math.max(...lightValues.map(item => Number(item.lightRaw))),
  } : null;
  const lightLuxValues = items.filter(item => Number.isFinite(Number(item.lightLux)));
  const lightLux = lightLuxValues.length ? {
    average: +(lightLuxValues.reduce((sum, item) => sum + Number(item.lightLux), 0) / lightLuxValues.length).toFixed(1),
    min: Math.min(...lightLuxValues.map(item => Number(item.lightLux))),
    max: Math.max(...lightLuxValues.map(item => Number(item.lightLux))),
  } : null;
  const outside = items.reduce((counts, item) => {
    if (item.temperature < Number(thresholds.temperatureMin) || item.temperature > Number(thresholds.temperatureMax)) counts.temperature++;
    if (item.humidity < Number(thresholds.humidityMin) || item.humidity > Number(thresholds.humidityMax)) counts.humidity++;
    return counts;
  }, { temperature: 0, humidity: 0 });
  return {
    period: requestedRange?.label || '최근 24시간', start: new Date(start).toISOString(), end: new Date(end).toISOString(), sampleCount: items.length,
    temperature: { ...temperature, unit: '°C' },
    humidity: { ...humidity, unit: '%' },
    gasRaw: gasRaw ? { ...gasRaw, unit: 'ADC raw (0-1023)', threshold: thresholds.gasRawMax, samples: gasValues.length } : null,
    lightRaw: lightRaw ? { ...lightRaw, unit: 'ADC raw (0-1023)', limit: thresholds.lightRawLimit, direction: thresholds.lightRawDirection, samples: lightValues.length } : null,
    lightLux: lightLux ? { ...lightLux, unit: 'estimated lux', samples: lightLuxValues.length } : null,
    thresholds, readingsOutsideThreshold: outside,
  };
}

async function analyzeEnvironment(kind = 'manual', requestedRange) {
  const summary = summarizePeriod(kind === 'daily' ? undefined : requestedRange);
  if (!summary.sampleCount) throw new Error(`${summary.period}에 분석할 센서 기록이 없습니다.`);
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'PASTE_GEMINI_API_KEY_HERE') throw new Error('Set GEMINI_API_KEY in main.js first.');
  const { GoogleGenAI } = await import('@google/genai');
  aiClient ||= new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const result = await aiClient.models.generateContent({
    model: GEMINI_MODEL,
    contents: 'Room temperature, humidity, gas sensor raw readings, and estimated light level summary for ' + summary.period + '. Reply concisely in Korean. Separate observed facts, threshold violations, trends supported by the data, and suggested next steps. Do not make medical diagnoses or guarantee health outcomes; describe this as environmental reference information. Do not describe ADC raw sensor readings as lux or ppm, and clearly describe the CDS lux conversion as an estimate rather than a calibrated measurement.\nAnalysis type: ' + (kind === 'daily' ? 'daily summary' : 'user requested analysis') + '\nData: ' + JSON.stringify(summary),
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
    width: 1260, height: 860, minWidth: 920, minHeight: 650, backgroundColor: '#f4f6f8', icon: path.join(__dirname, 'assets', 'roomly.png'),
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

ipcMain.handle('data:get', () => ({ history: sensorHistory, thresholds, reports: savedReports, latest: sensorHistory.at(-1) || null, hasAccount: Boolean(GEMINI_API_KEY && GEMINI_API_KEY !== 'PASTE_GEMINI_API_KEY_HERE'), weatherSettings: { ...weatherSettings, apiKey: undefined }, weather: weatherSnapshot, openAtLogin: app.getLoginItemSettings().openAtLogin, lightCalibration }));
ipcMain.handle('light:save-calibration', (_event, settings) => {
  lightCalibration = {
    fixedResistorOhms: Math.max(100, Math.min(100000, Number(settings.fixedResistorOhms) || 10000)),
    resistanceAt10LuxOhms: Math.max(100, Math.min(10000000, Number(settings.resistanceAt10LuxOhms) || 15000)),
    gamma: Math.max(0.3, Math.min(1.2, Number(settings.gamma) || 0.7)),
    wiring: settings.wiring === 'ldr-low' ? 'ldr-low' : 'ldr-high',
  };
  sensorHistory = sensorHistory.map(item => item.lightRaw == null ? item : { ...item, lightLux: estimateLux(item.lightRaw) });
  saveStore();
  return lightCalibration;
});
ipcMain.handle('weather:save', async (_event, settings) => {
  weatherSettings = { ...weatherSettings, region: String(settings.region || '서울').slice(0, 30), nx: Math.max(1, Math.min(149, Number(settings.nx) || 60)), ny: Math.max(1, Math.min(253, Number(settings.ny) || 127)), stnId: Math.max(1, Number(settings.stnId) || 108), apiKey: String(settings.apiKey || weatherSettings.apiKey || '').trim() };
  saveStore(); await refreshWeather(); return { ...weatherSettings, apiKey: undefined };
});
ipcMain.handle('weather:refresh', refreshWeather);
ipcMain.handle('startup:set', (_event, enabled) => { app.setLoginItemSettings({ openAtLogin: Boolean(enabled), path: process.execPath }); return app.getLoginItemSettings().openAtLogin; });
ipcMain.handle('notifications:settings', async () => { if (process.platform === 'win32') await shell.openExternal('ms-settings:notifications'); return true; });
ipcMain.handle('thresholds:save', (_event, next) => {
  thresholds = { temperatureMin: Number(next.temperatureMin), temperatureMax: Number(next.temperatureMax), humidityMin: Number(next.humidityMin), humidityMax: Number(next.humidityMax), gasRawMax: Math.max(0, Math.min(1023, Number.isFinite(Number(next.gasRawMax)) ? Number(next.gasRawMax) : 700)), lightLuxLimit: Math.max(0, Math.min(200000, Number.isFinite(Number(next.lightLuxLimit)) ? Number(next.lightLuxLimit) : 100)), lightLuxDirection: next.lightLuxDirection === 'above' ? 'above' : 'below' };
  saveStore();
  return thresholds;
});
ipcMain.handle('thresholds:reset', () => {
  thresholds = { ...DEFAULT_THRESHOLDS };
  saveStore();
  return thresholds;
});
ipcMain.handle('ai:analyze', (_event, range) => analyzeEnvironment('manual', range));
ipcMain.handle('notifications:test', () => {
  if (!Notification.isSupported()) throw new Error('Windows notifications are not available on this system.');
  new Notification({ title: 'Roomly notification test', body: 'Windows desktop notifications are working.', icon: path.join(__dirname, 'assets', 'roomly.png') }).show();
  return true;
});
ipcMain.handle('notifications:test-light', () => {
  if (!Notification.isSupported()) throw new Error('Windows 알림을 사용할 수 없습니다. Windows 알림 설정을 확인해 주세요.');
  const latest = [...sensorHistory].reverse().find(item => item.lightLux != null);
  if (!latest) throw new Error('아직 조도값을 받지 못했습니다. 센서 JSON의 lightRaw 또는 CSV 네 번째 값을 확인해 주세요.');
  const limit = Number(thresholds.lightLuxLimit);
  const outside = thresholds.lightLuxDirection === 'above' ? latest.lightLux > limit : latest.lightLux < limit;
  new Notification({ title: 'Roomly · 조도 알림 미리보기', body: `현재 약 ${Number(latest.lightLux).toFixed(0)} lux · 기준 ${limit} lux\n${outside ? '현재 조도 알림 조건에 해당합니다.' : '현재 설정 기준 범위 안입니다.'}`, icon: path.join(__dirname, 'assets', 'roomly.png') }).show();
  return { lightLux: latest.lightLux, outside };
});
ipcMain.handle('app:open-external', async (_event, value) => {
  let url;
  try { url = new URL(String(value)); } catch { return false; }
  if (!['https:', 'http:'].includes(url.protocol)) return false;
  await shell.openExternal(url.href);
  return true;
});

app.whenReady().then(() => {
  readStore();
  if (weatherSettings.apiKey && safeStorage.isEncryptionAvailable()) saveStore();
  createWindow();
  refreshWeather();
  setInterval(refreshWeather, 30 * 60 * 1000);
  const dailyReview = async () => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'PASTE_GEMINI_API_KEY_HERE' || lastDailyReportDate === today || !sensorHistory.length || new Date().getHours() < 8) return;
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
