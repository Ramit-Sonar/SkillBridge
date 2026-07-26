import { createRoot } from "react-dom/client";
import App from "./app/App";
import { loadPlatformSettings } from "./app/data/platformSettingsStore";
import { installMaintenanceModeInterceptor } from "./services/apiConfig";
import "./styles/index.css";

installMaintenanceModeInterceptor();
loadPlatformSettings();

createRoot(document.getElementById("root")!).render(<App />);
