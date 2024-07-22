const { contextBridge, ipcRenderer, remote } = require('electron');
const os = require('os');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { exec } = require('child_process');

contextBridge.exposeInMainWorld('electronAPI', {
    openFileDialog: (options) => ipcRenderer.invoke('open-file-dialog', options),
    downloadJar: () => ipcRenderer.invoke('download-jar')
});

contextBridge.exposeInMainWorld('nodeAPI', {
    os: os,
    fs: fs,
    path: path,
    yaml: yaml,
    exec: exec
});

contextBridge.exposeInMainWorld('remote', remote);
