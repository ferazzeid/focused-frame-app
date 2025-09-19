import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { MicrophoneProvider } from './contexts/MicrophoneContext.tsx';

createRoot(document.getElementById("root")!).render(
  <MicrophoneProvider>
    <App />
  </MicrophoneProvider>
);
