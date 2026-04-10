import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [apiStatus, setApiStatus] = useState<string>("Checking API...");

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => setApiStatus(`API connected: ${data.status}`))
      .catch(() => setApiStatus("API connection failed"));
  }, []);

  return (
    <>
      <section id="center">
        <p>{apiStatus}</p>
      </section>
    </>
  );
}

export default App;
