document.getElementById('close').addEventListener('click', () => {
    window.close();
});

document.getElementById('playNowButton').addEventListener('click', async () => {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.textContent = 'Downloading and launching...';
    try {
        const result = await window.electronAPI.downloadJar();
        statusMessage.textContent = result;
    } catch (error) {
        statusMessage.textContent = `Error: ${error.message}`;
    }
});

document.getElementById('advancedSettingsButton').addEventListener('click', () => {
    window.location.href = 'advancedSettings.html';
});
