import { Routes, Route, Navigate } from "react-router-dom";
import Register from "./components/register";
import Login from "./components/authentication";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/authentication" replace />} />

      <Route path="/register" element={<Register />} />
      <Route path="/authentication" element={<Login />} />

      {/* Add future pages here */}
      {/* <Route path="/dashboard" element={<Dashboard />} /> */}
    </Routes>
  );
}

export default App;