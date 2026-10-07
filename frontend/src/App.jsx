import { Routes, Route, Navigate } from "react-router-dom";
import FormPage from "./pages/FormPage.jsx";
import SuccessPage from "./pages/SuccessPage.jsx";
import ValidatePage from "./pages/ValidatePage.jsx";
import ScannerPage from "./pages/ScannerPage.jsx";
import ScannerDevicePage from "./pages/ScannerDevicePage.jsx";
import RegistrationsPage from "./pages/RegistrationsPage.jsx";
import AfyaQuizPage from "./pages/AfyaQuizPage.jsx";
import AfyaRegistrationsPage from "./pages/AfyaRegistrationsPage.jsx";
import MinasFormPage from "./pages/MinasFormPage.jsx";
import MinasSuccessPage from "./pages/MinasSuccessPage.jsx";
import MinasRegistrationsPage from "./pages/MinasRegistrationsPage.jsx";

export default function App() {
  return (
    <Routes>
      {/* Formulario (celular) */}
      <Route path="/" element={<Navigate to="/farmaceutico" replace />} />
      <Route path="/farmaceutico" element={<FormPage />} />
      <Route path="/medico" element={<FormPage tipoFormulario="medico" />} />
      <Route path="/afya" element={<AfyaQuizPage />} />
      <Route path="/form-minas" element={<MinasFormPage />} />
      <Route path="/form-minas/sucesso/:id" element={<MinasSuccessPage />} />
      {/* Tela de sucesso com o QR Code gerado */}
      <Route path="/sucesso/:code" element={<SuccessPage />} />
      {/* Pagina publica ao escanear o link do QR */}
      <Route path="/validar/:code" element={<ValidatePage />} />
      {/* Tela de leitura para o tablet (equipe) */}
      <Route path="/leitor" element={<ScannerPage />} />
      {/* Tela de leitura com scanner de dispositivo (equipe) */}
      <Route path="/leitor-scanner" element={<ScannerDevicePage />} />
      {/* Gestao dos cadastros + exportacao CSV (equipe) */}
      <Route path="/cadastros" element={<RegistrationsPage />} />
      <Route path="/afya-cadastros" element={<AfyaRegistrationsPage />} />
      <Route path="/form-minas-cadastros" element={<MinasRegistrationsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
