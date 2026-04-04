import { useState } from "react";
// @ts-ignore
import NeroIntro from "./components/NeroIntro";

function App() {
  const [ready, setReady] = useState(false);

  if (!ready) {
    return <NeroIntro onComplete={() => setReady(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900">Nero Party</h1>
        <p className="mt-2 text-gray-600">Start building here.</p>
      </div>
    </div>
  );
}

export default App;
