const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  globalShortcut,
} = require("electron");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const os = require("os");
const { exec } = require("child_process");
const yaml = require("js-yaml");

if (process.env.NODE_ENV !== "production") {
  try {
    require("electron-reload")(__dirname, {
      electron: require(`${__dirname}/node_modules/electron`),
    });
  } catch (_) {
    console.log("Error loading electron-reload");
  }
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 300,
    title: "RuneTron",
    icon: path.join(__dirname, "assets/icon.ico"),
    frame: false,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: true,
    },
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile("index.html");

  // Register a shortcut to open the Developer Tools
  globalShortcut.register("CommandOrControl+Shift+I", () => {
    mainWindow.webContents.openDevTools();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle("open-file-dialog", async (event, options) => {
  const result = await dialog.showOpenDialog(options);
  return result;
});

ipcMain.handle("download-jar", async (event) => {
  const homeDir = os.homedir();
  const runeConfPath = path.join(homeDir, "RuneTron.conf");
  let jarDir = homeDir;

  if (fs.existsSync(runeConfPath)) {
    const runeConfContent = fs.readFileSync(runeConfPath, "utf-8");
    const runeConf = yaml.load(runeConfContent);

    if (runeConf.jarDir) {
      jarDir = runeConf.jarDir;
    }
  }

  const jarUrl =
    "https://github.com/runejs/refactored-client-435/raw/master/prebuilt/client-435-0.3.jar";
  const jarPath = path.join(jarDir, "client-435-0.3.jar");
  const confPath = path.join(homeDir, "client-435.conf.yaml");

  const writer = fs.createWriteStream(jarPath);
  let response;
  try {
    response = await axios({
      url: jarUrl,
      method: "GET",
      responseType: "stream",
    });
  } catch (error) {
    event.sender.send(
      "status-message",
      `Error downloading JAR: ${error.message}`
    );
    return;
  }

  response.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", (error) => {
      event.sender.send("status-message", `Error saving JAR: ${error.message}`);
      reject(error);
    });
  });

  if (!fs.existsSync(confPath)) {
    const confContent = `
net:
  address: 0.0.0.0
  game_port: 43594
cache:
  cacheDir: .filestore_435
rsa:
  rsaPub: 65537
  rsaModulus: 119568088839203297999728368933573315070738693395974011872885408638642676871679245723887367232256427712869170521351089799352546294030059890127723509653145359924771433131004387212857375068629466435244653901851504845054452735390701003613803443469723435116497545687393297329052988014281948392136928774011011998343
login:
  useStaticCredentials: false
  username: a
  password: a
game:
  roofsEnabled: true
  freeTeleports: false
  debugContextMenu: true
serverDisplayName: Build 435
`;
    fs.writeFileSync(confPath, confContent.trim());
  }

  let javaDir;
  try {
    javaDir = await new Promise((resolve, reject) => {
      exec("for %i in (java.exe) do @echo. %~$PATH:i", (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(stdout.trim());
      });
    });
  } catch (error) {
    event.sender.send("status-message", `Error finding Java: ${error.message}`);
    return;
  }

  const runeConfContent = {
    javaPath: javaDir,
    jarDir: jarDir,
  };
  fs.writeFileSync(runeConfPath, yaml.dump(runeConfContent));

  exec(`"${javaDir}" -jar "${jarPath}"`, (error, stdout, stderr) => {
    if (error) {
      event.sender.send(
        "status-message",
        `Error launching JAR: ${error.message}`
      );
      return;
    }
    if (stderr) {
      event.sender.send("status-message", `JAR Stderr: ${stderr}`);
      return;
    }
    console.log(`Stdout: ${stdout}`);
  });

  event.sender.send("status-message", "Downloaded and launched");
});
