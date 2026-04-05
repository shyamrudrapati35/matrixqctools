// import { useState } from "react";
import "./App.css";
import { Routes, Route } from "react-router-dom";
import Set from "./pages/setpage/Set";
import Save from "./pages/savepage/Save";
import Navigation from "./components/navigation/Navigation";
import Mainnav from "./components/main navigation/Mainnav";
import Wtr from "./pages/wtr/Wtr";

function App() {
  // const [count, setCount] = useState(0);

  return (
    <div className="main_page_layout">
      <Mainnav />
      <div className="main_page">
        <Routes>
          <Route path="/wtr/set" element={<Wtr category="wtr" />} />
          <Route path="/wtr/save" element={<Save category="wtr" />} />
          <Route path="/rg/set" element={<Set category="rg" />} />
          <Route path="/rg/save" element={<Save category="rg" />} />
          <Route path="/temp/set" element={<Wtr category="temp" />} />
          <Route path="/temp/save" element={<Save category="temp" />} />
          <Route path="/dgu/set" element={<Wtr category="dgu" />} />
          <Route path="/dgu/save" element={<Save category="dgu" />} />
        </Routes>
      </div>
      <Navigation />
    </div>
  );
}

export default App;
