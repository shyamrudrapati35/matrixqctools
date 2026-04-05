// import { useState } from "react";
import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import Save from "./pages/savepage/Save";
import Navigation from "./components/navigation/Navigation";
import Mainnav from "./components/main navigation/Mainnav";
import Coming from "./pages/trail/Holder";

//rgpage import
import Rg from "./pages/rgpage/Rg";

//waterepage import
import Wtr from "./pages/wtrpage/Wtr";

//tempering page import
import Temp from "./pages/tempring/Temp";

//dgu page import
import Dgu from "./pages/dgupage/Dgu";

function App() {
  // const [count, setCount] = useState(0);

  return (
    <div className="main_page_layout">
      <Mainnav />
      <div className="main_page">
        <Routes>
          <Route path="/" element={<Navigate to="/rg/set" replace />} />
          <Route path="/wtr/set" element={<Wtr category="wtr" />} />
          <Route path="/wtr/save" element={<Save category="wtr" />} />
          <Route path="/rg/set" element={<Rg category="rg" />} />
          <Route path="/rg/save" element={<Save category="rg" />} />
          <Route path="/temp/set" element={<Temp category="temp" />} />
          <Route path="/temp/save" element={<Save category="temp" />} />
          <Route path="/dgu/set" element={<Dgu category="dgu" />} />
          <Route path="/dgu/save" element={<Save category="dgu" />} />
        </Routes>
      </div>
      <Navigation />
    </div>
  );
}

export default App;
