import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Magic Lawyer - Administração",
  description: "Painel administrativo do sistema Magic Lawyer",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-lg">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-blue-600">🔑 Magic Lawyer Admin</h1>
            <p className="text-sm text-gray-500 mt-2">Sistema Administrativo</p>
          </div>

          <nav className="mt-6">
            <div className="px-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Administração</h3>

              <ul className="space-y-2">
                <li>
                  <a href="/admin/dashboard" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100">
                    📊 Dashboard
                  </a>
                </li>
                <li>
                  <a href="/admin/tenants" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100">
                    🏢 Tenants
                  </a>
                </li>
                <li>
                  <a href="/admin/juizes" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100">
                    👨‍⚖️ Juízes Globais
                  </a>
                </li>
                <li>
                  <a href="/admin/pacotes" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100">
                    💎 Pacotes Premium
                  </a>
                </li>
              </ul>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
