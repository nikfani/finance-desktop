const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectExcelFile: () => ipcRenderer.invoke('select-excel-file'),
  onImportData: (callback) => ipcRenderer.on('import-data', callback),
});