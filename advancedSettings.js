document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("close").addEventListener("click", () => {
    window.close();
  });

  const homeDir = window.nodeAPI.os.homedir();
  const fs = window.nodeAPI.fs;
  const path = window.nodeAPI.path;
  const yaml = window.nodeAPI.yaml;

  const runeConfPath = path.join(homeDir, "RuneTron.conf");
  const yamlConfPath = path.join(homeDir, "client-435.conf.yaml");

  let javaDir = "";
  let jarDir = homeDir; // Default to home directory

  if (fs.existsSync(runeConfPath)) {
    const runeConfContent = fs.readFileSync(runeConfPath, "utf-8");
    const runeSettings = yaml.load(runeConfContent);
    javaDir = runeSettings.javaPath || "";
    jarDir = runeSettings.jarDir || homeDir;
  }

  // Detect javaPath if not set
  if (!javaDir) {
    javaDir = await new Promise((resolve) => {
      window.nodeAPI.exec(
        "for %i in (java.exe) do @echo. %~$PATH:i",
        (error, stdout) => {
          if (error) {
            resolve("");
            return;
          }
          resolve(stdout.trim());
        }
      );
    });

    if (javaDir) {
      const newRuneSettings = { javaPath: javaDir, jarDir: jarDir };
      fs.writeFileSync(runeConfPath, yaml.dump(newRuneSettings));
    }
  }

  if (fs.existsSync(yamlConfPath)) {
    const yamlConfContent = fs.readFileSync(yamlConfPath, "utf-8");
    const settings = yaml.load(yamlConfContent);

    document.getElementById("gameAddress").value = settings.net.address;
    document.getElementById("gamePort").value = settings.net.game_port;
    document.getElementById("cacheDir").value = settings.cache.cacheDir;
    document.getElementById("rsaPub").value = settings.rsa.rsaPub;
    document.getElementById("rsaModulus").value = settings.rsa.rsaModulus;
    document.getElementById("useStaticCredentials").checked =
      settings.login.useStaticCredentials;
    document.getElementById("username").value = settings.login.username;
    document.getElementById("password").value = settings.login.password;
  }

  document.getElementById("javaDir").value = javaDir;
  document.getElementById("jarDir").value = jarDir;

  // Toggle the visibility of username and password fields
  const useStaticCredentialsCheckbox = document.getElementById(
    "useStaticCredentials"
  );
  const staticCredentialsFields = document.getElementById(
    "staticCredentialsFields"
  );

  const toggleStaticCredentialsFields = () => {
    if (useStaticCredentialsCheckbox.checked) {
      staticCredentialsFields.classList.remove("hidden");
    } else {
      staticCredentialsFields.classList.add("hidden");
    }
  };

  useStaticCredentialsCheckbox.addEventListener(
    "change",
    toggleStaticCredentialsFields
  );
  toggleStaticCredentialsFields(); // Initial toggle based on current state

  document.getElementById("backButton").addEventListener("click", () => {
    window.location.href = "index.html";
  });

  document
    .getElementById("saveSettingsButton")
    .addEventListener("click", () => {
      const form = document.getElementById("settingsForm");
      const formData = new FormData(form);
      const settings = {
        net: {
          address: formData.get("gameAddress"),
          game_port: formData.get("gamePort"),
        },
        cache: {
          cacheDir: formData.get("cacheDir"),
        },
        rsa: {
          rsaPub: formData.get("rsaPub"),
          rsaModulus: formData.get("rsaModulus"),
        },
        login: {
          useStaticCredentials: formData.get("useStaticCredentials") === "on",
          username: formData.get("username"),
          password: formData.get("password"),
        },
      };

      const javaSettings = {
        javaPath: formData.get("javaDir"),
        jarDir: formData.get("jarDir"),
      };

      const homeDir = window.nodeAPI.os.homedir();
      const fs = window.nodeAPI.fs;
      const path = window.nodeAPI.path;
      const yaml = window.nodeAPI.yaml;

      const yamlConfPath = path.join(homeDir, "client-435.conf.yaml");
      const runeConfPath = path.join(homeDir, "RuneTron.conf");

      fs.writeFileSync(yamlConfPath, yaml.dump(settings));
      fs.writeFileSync(runeConfPath, yaml.dump(javaSettings));

      window.location.href = "index.html";
    });

  document
    .getElementById("restoreDefaultsButton")
    .addEventListener("click", () => {
      const defaultSettings = {
        net: {
          address: "0.0.0.0",
          game_port: 43594,
        },
        cache: {
          cacheDir: ".filestore_435",
        },
        rsa: {
          rsaPub: 65537,
          rsaModulus:
            "119568088839203297999728368933573315070738693395974011872885408638642676871679245723887367232256427712869170521351089799352546294030059890127723509653145359924771433131004387212857375068629466435244653901851504845054452735390701003613803443469723435116497545687393297329052988014281948392136928774011011998343",
        },
        login: {
          useStaticCredentials: false,
          username: "a",
          password: "a",
        },
      };

      const javaDefaults = {
        javaPath: "",
        jarDir: window.nodeAPI.os.homedir(),
      };

      const form = document.getElementById("settingsForm");
      form.querySelector("#gameAddress").value = defaultSettings.net.address;
      form.querySelector("#gamePort").value = defaultSettings.net.game_port;
      form.querySelector("#cacheDir").value = defaultSettings.cache.cacheDir;
      form.querySelector("#rsaPub").value = defaultSettings.rsa.rsaPub;
      form.querySelector("#rsaModulus").value = defaultSettings.rsa.rsaModulus;
      form.querySelector("#useStaticCredentials").checked =
        defaultSettings.login.useStaticCredentials;
      form.querySelector("#username").value = defaultSettings.login.username;
      form.querySelector("#password").value = defaultSettings.login.password;
      form.querySelector("#javaDir").value = javaDefaults.javaPath;
      form.querySelector("#jarDir").value = javaDefaults.jarDir;

      toggleStaticCredentialsFields(); // Update visibility based on restored defaults
    });

  document
    .getElementById("browseJavaDir")
    .addEventListener("click", async () => {
      const result = await window.electronAPI.openFileDialog({
        properties: ["openFile"],
        filters: [{ name: "Executables", extensions: ["exe"] }],
      });
      if (!result.canceled && result.filePaths.length > 0) {
        document.getElementById("javaDir").value = result.filePaths[0];
      }
    });

  document
    .getElementById("browseJarDir")
    .addEventListener("click", async () => {
      const result = await window.electronAPI.openFileDialog({
        properties: ["openDirectory"],
      });
      if (!result.canceled && result.filePaths.length > 0) {
        document.getElementById("jarDir").value = result.filePaths[0];
      }
    });
});
