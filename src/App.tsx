import { HashRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import PasswordGate from "./components/PasswordGate";
import TopPage from "./pages/TopPage";
import TripDetailPage from "./pages/TripDetailPage";

export default function App() {
  return (
    <PasswordGate>
      <HashRouter>
        <Header />
        <Routes>
          <Route path="/" element={<TopPage />} />
          <Route path="/trips/:tripId" element={<TripDetailPage />} />
        </Routes>
      </HashRouter>
    </PasswordGate>
  );
}
