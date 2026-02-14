import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import "./index.css";

const container = document.getElementById("root");

if (container) {
    const root = createRoot(container);
    root.render(
        <BrowserRouter>
            <AuthProvider>
                <App />
            </AuthProvider>
        </BrowserRouter>
    );
}