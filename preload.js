const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('roomApp', {
  getData: () => ipcRenderer.invoke('data:get'),
  listPorts: () => ipcRenderer.invoke('ports:list'),
  connect: options => ipcRenderer.invoke('serial:connect', options),
  disconnect: () => ipcRenderer.invoke('serial:disconnect'),
  saveThresholds: thresholds => ipcRenderer.invoke('thresholds:save', thresholds),
  resetThresholds: () => ipcRenderer.invoke('thresholds:reset'),
  saveApiKey: key => ipcRenderer.invoke('key:save', key),
  clearApiKey: () => ipcRenderer.invoke('key:clear'),
  analyze: () => ipcRenderer.invoke('ai:analyze'),
  onReading: callback => ipcRenderer.on('sensor:reading', (_event, reading) => callback(reading)),
  onSerialStatus: callback => ipcRenderer.on('serial:status', (_event, status) => callback(status)),
  onReport: callback => ipcRenderer.on('ai:report', (_event, report) => callback(report)),
});
