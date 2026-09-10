import React, { useState } from "react";
import { ApiProvider, useApi } from "./context/ApiContext";
import { Header } from "./components/common/Header";
import { Sidebar, TabType } from "./components/common/Sidebar";
import { LoadingOverlay } from "./components/common/LoadingOverlay";
import { DashboardPage } from "./pages/DashboardPage";
import { LivePredictionPage } from "./pages/LivePredictionPage";
import { PredictionResultsPage } from "./pages/PredictionResultsPage";
import { ForecastChartPage } from "./pages/ForecastChartPage";
import { NetworkStatePage } from "./pages/NetworkStatePage";
import { RawTrafficUploadPage } from "./pages/RawTrafficUploadPage";
import { SystemStatusPage } from "./pages/SystemStatusPage";
import { MessageSecurityPage } from "./pages/MessageSecurityPage";
import { IncidentCenterPage } from "./pages/IncidentCenterPage";
import { MobileGatewayPage } from "./pages/MobileGatewayPage";

const MainContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const { isPredicting, loadingMessage } = useApi();

  const renderActivePage = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardPage setActiveTab={setActiveTab} />;
      case "prediction":
        return <LivePredictionPage setActiveTab={setActiveTab} />;
      case "results":
        return <PredictionResultsPage setActiveTab={setActiveTab} />;
      case "forecast":
        return <ForecastChartPage setActiveTab={setActiveTab} />;
      case "network-state":
        return <NetworkStatePage setActiveTab={setActiveTab} />;
      case "raw-upload":
        return <RawTrafficUploadPage setActiveTab={setActiveTab} />;
      case "message-security":
        return <MessageSecurityPage />;
      case "incidents":
        return <IncidentCenterPage />;
      case "system-status":
        return <SystemStatusPage />;
      default:
        return <DashboardPage setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Header */}
      <Header />

      {/* Main Layout Container */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {renderActivePage()}
        </main>
      </div>

      {/* Global Loading Overlay for Live Pipeline Requests */}
      {isPredicting && <LoadingOverlay message={loadingMessage} />}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ApiProvider>
      <MainContent />
    </ApiProvider>
  );
};

export default App;
