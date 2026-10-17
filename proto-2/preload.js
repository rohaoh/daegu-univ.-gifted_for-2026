const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('roomApp', {
  getData: () => ipcRenderer.invoke('data:get'),
  listPorts: () => ipcRenderer.invoke('ports:list'),
  connect: options => ipcRenderer.invoke('serial:connect', options),
  disconnect: () => ipcRenderer.invoke('serial:disconnect'),
  saveThresholds: thresholds => ipcRenderer.invoke('thresholds:save', thresholds),
  resetThresholds: () => ipcRenderer.invoke('thresholds:reset'),
  saveLightCalibration: settings => ipcRenderer.invoke('light:save-calibration', settings),
  analyze: () => ipcRenderer.invoke('ai:analyze'),
  testNotification: () => ipcRenderer.invoke('notifications:test'),
  testLightAlert: () => ipcRenderer.invoke('notifications:test-light'),
  saveWeather: settings => ipcRenderer.invoke('weather:save', settings),
  refreshWeather: () => ipcRenderer.invoke('weather:refresh'),
  setStartup: enabled => ipcRenderer.invoke('startup:set', enabled),
  openNotificationSettings: () => ipcRenderer.invoke('notifications:settings'),
  openExternal: url => ipcRenderer.invoke('app:open-external', url),
  onReading: callback => ipcRenderer.on('sensor:reading', (_event, reading) => callback(reading)),
  onSerialStatus: callback => ipcRenderer.on('serial:status', (_event, status) => callback(status)),
  onReport: callback => ipcRenderer.on('ai:report', (_event, report) => callback(report)),
  onWeather: callback => ipcRenderer.on('weather:update', (_event, weather) => callback(weather)),
});
