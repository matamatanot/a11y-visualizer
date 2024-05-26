import React from "react";
import "./index.css";
import {
  SettingsMessage,
  Settings,
  initialSettings,
  loadHostSettings,
  saveHostSettings,
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
    <div className="w-72" lang={lang}>
      <div className="p-2 flex flex-row gap-4 items-center justify-between bg-emerald-50">
        <div className="flex flex-row gap-1 items-center">
          <img
            src={enabled ? icon : iconDisabled}
            alt="icon"
            className="size-6"
          />
          <h1 className="text-xs font-bold text-emerald-800">
            {t("popup.title")}
          </h1>
          <button
            type="button"
            className="text-emerald-700 bg-opacity-0 rounded-full shrink-0 p-1
                hover:enabled:bg-emerald-100 hover:enabled:text-emerald-800 transition-colors
               disabled:text-slate-400 disabled:cursor-not-allowed"
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
          <span className="text-xs font-bold text-emerald-800">
            {t("popup.enabled")}
          </span>
        </Checkbox>
      </div>
      {host && (
        <div className="p-2 flex flex-col gap-2 items-stretch">
          <div className="flex flex-row gap-2 items-center">
            <h2 className="text-sm font-bold text-emerald-800 shrink">
              {t("popup.settingsForHost", { host })}
            </h2>
            <button
              type="button"
              className="text-emerald-700 bg-opacity-0 rounded-full shrink-0 p-1
                hover:enabled:bg-emerald-100 hover:enabled:text-emerald-800 transition-colors
               disabled:text-slate-400 disabled:cursor-not-allowed"
              onClick={async () => {
                await chrome.storage.local.remove(host);
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
          <p className="text-xs text-slate-500">{t("popup.hostDesc")}</p>
        </div>
      )}
    </div>
  );
};
