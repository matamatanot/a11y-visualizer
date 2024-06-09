import React from "react";
import "./index.css";
import {
  SettingsMessage,
  Settings,
  initialSettings,
  loadHostSettings,
  saveHostSettings,
  resetHostSettings,
} from "../settings";
import { useLang } from "../useLang";
import {
  sendMessageToActiveTab,
  sendMessageToActiveTabs,
} from "../chrome/tabs";
import { SettingsEditor } from "../components/SettingsEditor";
import { loadEnabled, saveEnabled } from "../enabled";
import { Checkbox } from "../components/Checkbox";
import icon from "../assets/icon.svg";
import iconDisabled from "../assets/icon-disabled.svg";
import { IoBackspaceOutline, IoReloadOutline } from "react-icons/io5";

const getCurrentHost = async () => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tabs[0]?.url;
  return url && url.match(/^https?:\/\//) ? new URL(url).host : undefined;
};

export const Popup = () => {
  const [settings, setSettings] = React.useState<Settings>(initialSettings);
  const [enabled, setEnabled] = React.useState<boolean>(false);
  const [host, setHost] = React.useState<string | undefined>(undefined);
  const [hostSetting, setHostSetting] = React.useState<boolean>(false);
  const { t, lang } = useLang();

  const loadSettings = async () => {
    const loadedEnabled = await loadEnabled();
    setEnabled(loadedEnabled);
    const host = await getCurrentHost();
    setHost(host);
    const [newSettings, found] = await loadHostSettings(host);
    setHostSetting(found);
    setSettings(newSettings);
    return newSettings;
  };

  React.useEffect(() => {
    loadSettings();
  }, []);

  const updateSettings = async (newSettings: Settings) => {
    setSettings(newSettings);
    if (host) {
      setHostSetting(true);
      saveHostSettings(host, newSettings);
      sendMessageToActiveTabs<SettingsMessage>({
        type: "updateHostSettings",
        settings: newSettings,
        enabled: enabled,
        host: host,
      });
    }
  };

  return (
    <div
      className="w-80 font-sans text-zinc-800 bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-300"
      lang={lang}
    >
      <div
        className="p-2 relative flex flex-row items-center justify-between gap-3
      bg-zinc-100 dark:bg-zinc-800"
      >
        <div className="flex flex-row gap-1 items-center justify-start">
          <img
            src={enabled ? icon : iconDisabled}
            alt={enabled ? t("popup.iconEyesOpen") : t("popup.iconEyesClosed")}
            className="size-8 -mt-1 -mb-1 -ml-1"
            width="24"
            height="24"
          />
          <h1 className="text-xs font-bold text-teal-800 dark:text-teal-200">
            {t("popup.title")}
          </h1>
          <button
            type="button"
            className="text-teal-700 bg-opacity-0 rounded-full shrink-0 p-1
                dark:text-teal-200
                hover:enabled:bg-zinc-200 transition-colors cursor-pointer
                dark:hover:enabled:bg-teal-800
                disabled:text-zinc-400 disabled:cursor-not-allowed z-10"
            onClick={() => {
              sendMessageToActiveTab({
                type: "applySettings",
                settings: settings,
                enabled: enabled,
              });
            }}
            disabled={!enabled || !host}
            title={t("popup.rerun")}
          >
            <IoReloadOutline
              role="img"
              aria-label={t("popup.rerun")}
              className="size-4"
            />
          </button>
        </div>
        <Checkbox
          onChange={async (e) => {
            setEnabled(e.target.checked);
            saveEnabled(e.target.checked);
            chrome.runtime.sendMessage({
              type: "updateEnabled",
              enabled: e.target.checked,
            });
            sendMessageToActiveTabs<SettingsMessage>({
              type: "updateEnabled",
              enabled: e.target.checked,
            });
          }}
          checked={enabled}
        >
          <span
            className="text-xs font-bold text-teal-800
          dark:text-teal-200 shrink-0"
          >
            {t("popup.enabled")}
          </span>
          <span className="absolute inset-0" />
        </Checkbox>
      </div>
      {host && (
        <div className="p-2 flex flex-col gap-2 items-stretch">
          <div className="flex flex-row gap-2 items-center">
            <h2 className="text-sm font-bold text-teal-800 dark:text-teal-200 shrink">
              {t("popup.settingsForHost", { host })}
            </h2>
            <button
              type="button"
              className="text-teal-700 bg-opacity-0 rounded-full shrink-0 p-1
                dark:text-teal-200
                hover:enabled:bg-zinc-100 transition-colors cursor-pointer
                dark:hover:enabled:bg-teal-800
                disabled:text-zinc-400 disabled:cursor-not-allowed"
              onClick={async () => {
                await resetHostSettings(host);
                const defaultSettings = await loadSettings();
                sendMessageToActiveTabs<SettingsMessage>({
                  type: "updateHostSettings",
                  settings: defaultSettings,
                  enabled: enabled,
                  host: host,
                });
              }}
              disabled={!enabled || !hostSetting}
              title={t("popup.reset")}
            >
              <IoBackspaceOutline
                role="img"
                aria-label={t("popup.reset")}
                className="size-4"
              />
            </button>
          </div>
          <SettingsEditor
            settings={settings}
            onChange={updateSettings}
            disabled={!enabled}
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t("popup.hostDesc")}
            <button
              className="link text-teal-700 underline hover:enabled:text-teal-900 transition-colors dark:text-teal-400 hover:enabled:dark:text-teal-200"
              onClick={() => chrome.runtime.openOptionsPage()}
            >
              {t("popup.openExtensionOptions")}
            </button>
          </p>
        </div>
      )}
    </div>
  );
};
