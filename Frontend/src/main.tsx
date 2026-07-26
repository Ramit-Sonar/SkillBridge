import { createRoot } from "react-dom/client";
import App from "./app/App";
import { installMaintenanceModeInterceptor } from "./services/apiConfig";
import "./styles/index.css";

installMaintenanceModeInterceptor();

createRoot(document.getElementById("root")!).render(<App />);
