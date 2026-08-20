import DashboardShell from "./app/DashboardShell";
import Dashboard from "./pages/Dashboard";

import "./styles/theme.css";
import "./styles/dashboard.css";


export default function App(){

  return (

    <DashboardShell>

      <Dashboard />

    </DashboardShell>

  );

}
