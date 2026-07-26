import { useEffect, useSyncExternalStore } from "react";
import {
  getPublicPlatformSettings,
  type PlatformSettings,
} from "../../services/adminService";

export type PlatformDisplaySettings = Pick<
  PlatformSettings,
  "platformName" | "supportEmail" | "platformDescription" | "logoUrl" | "maintenanceMessage"
>;

const DEFAULT_SETTINGS: PlatformDisplaySettings = {
  platformName: "SkillBridge",
  supportEmail: "support@skillbridge.com",
  platformDescription:
    "A platform connecting verified students with local clients for real-world projects.",
  logoUrl: "",
  maintenanceMessage: "SkillBridge is currently under maintenance.",
};

let settings: PlatformDisplaySettings = { ...DEFAULT_SETTINGS };
let loadPromise: Promise<void> | null = null;
let loaded = false;
const listeners = new Set<() => void>();

const applyDocumentSettings = () => {
  if (typeof document === "undefined") return;

  document.title = settings.platformName;

  const metaDescription = document.querySelector<HTMLMetaElement>(
    'meta[name="description"]'
  );

  if (metaDescription) {
    metaDescription.content = settings.platformDescription;
  }
};

const notify = () => {
  applyDocumentSettings();
  listeners.forEach((listener) => listener());
};

export const getPlatformSettingsSnapshot = () => settings;

export const setPlatformSettings = (
  nextSettings: Partial<PlatformDisplaySettings>
) => {
  const cleanSettings = Object.fromEntries(
    Object.entries(nextSettings).filter(([, value]) => value !== undefined)
  ) as Partial<PlatformDisplaySettings>;

  settings = {
    ...settings,
    ...cleanSettings,
  };

  notify();
};

export const subscribePlatformSettings = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const loadPlatformSettings = async () => {
  if (loaded) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = getPublicPlatformSettings()
    .then((response) => {
      setPlatformSettings(response.data);
      loaded = true;
    })
    .catch(() => {
      applyDocumentSettings();
    })
    .finally(() => {
      loadPromise = null;
    });

  return loadPromise;
};

export const usePlatformSettings = () => {
  const currentSettings = useSyncExternalStore(
    subscribePlatformSettings,
    getPlatformSettingsSnapshot,
    getPlatformSettingsSnapshot
  );

  useEffect(() => {
    loadPlatformSettings();
  }, []);

  return currentSettings;
};

applyDocumentSettings();
