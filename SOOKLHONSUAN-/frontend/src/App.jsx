import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Calculate from "./pages/Calculate";
import Summary from "./pages/Summary";
import History from "./pages/History";
import ValueSummary from "./pages/ValueSummary";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/calculate" element={<Calculate />} />
        <Route path="/summary" element={<Summary />} />
        <Route path="/history" element={<History />} />
        <Route path="/value-summary" element={<ValueSummary />} />
      </Routes>
    </Router>
  );
}
export default App;
