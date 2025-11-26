import { Outlet } from "react-router-dom";

function App() {
  return (
    // Tes background abu-abu dan font sans-serif
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
      <main className="flex justify-center items-center min-h-screen p-4">
        {/* Container utama */}
        <div className="w-full max-w-4xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default App;
