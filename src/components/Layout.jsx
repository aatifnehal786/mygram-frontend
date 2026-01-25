import { Outlet } from "react-router-dom";
import Header from "./Header";

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 pt-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>

    </div>
  );
}
