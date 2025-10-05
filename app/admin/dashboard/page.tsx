import { prisma } from "@/app/lib/prisma";

export default async function AdminDashboard() {
  // Buscar estatísticas do sistema
  const [totalTenants, activeTenants, totalJuizes, publicJuizes, premiumJuizes, totalUsuarios, totalFaturas, faturamentoTotal] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { status: "ACTIVE" } }),
    prisma.juiz.count(),
    prisma.juiz.count({ where: { isPublico: true } }),
    prisma.juiz.count({ where: { isPremium: true } }),
    prisma.usuario.count(),
    prisma.fatura.count(),
    prisma.fatura.aggregate({
      where: { status: "PAGA" },
      _sum: { valor: true },
    }),
  ]);

  const faturamento = Number(faturamentoTotal._sum.valor || 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">🔑 Dashboard Administrativo</h1>
        <p className="text-gray-600 mt-2">Visão geral do sistema Magic Lawyer</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Tenants */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <span className="text-2xl">🏢</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total de Tenants</p>
              <p className="text-2xl font-bold text-gray-900">{totalTenants}</p>
              <p className="text-sm text-green-600">{activeTenants} ativos</p>
            </div>
          </div>
        </div>

        {/* Juízes */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <span className="text-2xl">👨‍⚖️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Juízes Globais</p>
              <p className="text-2xl font-bold text-gray-900">{totalJuizes}</p>
              <p className="text-sm text-blue-600">
                {publicJuizes} públicos, {premiumJuizes} premium
              </p>
            </div>
          </div>
        </div>

        {/* Usuários */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total de Usuários</p>
              <p className="text-2xl font-bold text-gray-900">{totalUsuarios}</p>
              <p className="text-sm text-gray-500">Em todos os tenants</p>
            </div>
          </div>
        </div>

        {/* Faturamento */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Faturamento Total</p>
              <p className="text-2xl font-bold text-gray-900">R$ {faturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              <p className="text-sm text-green-600">{totalFaturas} faturas pagas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">⚡ Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/admin/tenants" className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="text-center">
              <span className="text-2xl mb-2 block">🏢</span>
              <p className="font-medium text-gray-900">Gerenciar Tenants</p>
              <p className="text-sm text-gray-500">Ver todos os escritórios</p>
            </div>
          </a>

          <a href="/admin/juizes" className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
            <div className="text-center">
              <span className="text-2xl mb-2 block">👨‍⚖️</span>
              <p className="font-medium text-gray-900">Gerenciar Juízes</p>
              <p className="text-sm text-gray-500">Juízes globais</p>
            </div>
          </a>

          <a href="/admin/pacotes" className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
            <div className="text-center">
              <span className="text-2xl mb-2 block">💎</span>
              <p className="font-medium text-gray-900">Pacotes Premium</p>
              <p className="text-sm text-gray-500">Configurar monetização</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
