import { Routes, Route, Navigate } from "react-router-dom";
import FormPage from "./pages/FormPage.jsx";
import SuccessPage from "./pages/SuccessPage.jsx";
import ValidatePage from "./pages/ValidatePage.jsx";
import ScannerPage from "./pages/ScannerPage.jsx";
import RegistrationsPage from "./pages/RegistrationsPage.jsx";

export default function App() {
  return (
    <Routes>
      {/* Formulario (celular) */}
      <Route path="/" element={<FormPage />} />
      {/* Tela de sucesso com o QR Code gerado */}
      <Route path="/sucesso/:code" element={<SuccessPage />} />
      {/* Pagina publica ao escanear o link do QR */}
      <Route path="/validar/:code" element={<ValidatePage />} />
      {/* Tela de leitura para o tablet (equipe) */}
      <Route path="/leitor" element={<ScannerPage />} />
      {/* Gestao dos cadastros + exportacao CSV (equipe) */}
      <Route path="/cadastros" element={<RegistrationsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
