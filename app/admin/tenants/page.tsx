import { prisma } from "@/app/lib/prisma";

export default async function TenantsPage() {
  const tenants = await prisma.tenant.findMany({
    include: {
      _count: {
        select: {
          usuarios: true,
          processos: true,
          clientes: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🏢 Gerenciar Tenants</h1>
          <p className="text-gray-600 mt-2">Administre todos os escritórios de advocacia do sistema</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Total de Tenants</p>
          <p className="text-2xl font-bold text-gray-900">{tenants.length}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Ativos</p>
          <p className="text-2xl font-bold text-green-600">{tenants.filter((t) => t.status === "ACTIVE").length}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Suspensos</p>
          <p className="text-2xl font-bold text-yellow-600">{tenants.filter((t) => t.status === "SUSPENDED").length}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Cancelados</p>
          <p className="text-2xl font-bold text-red-600">{tenants.filter((t) => t.status === "CANCELLED").length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Lista de Tenants</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuários</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Processos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clientes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Criado em</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                      <div className="text-sm text-gray-500">{tenant.slug}</div>
                      {tenant.domain && <div className="text-sm text-blue-600">{tenant.domain}</div>}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        tenant.status === "ACTIVE" ? "bg-green-100 text-green-800" : tenant.status === "SUSPENDED" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {tenant.status === "ACTIVE" ? "✅ Ativo" : tenant.status === "SUSPENDED" ? "⚠️ Suspenso" : "❌ Cancelado"}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tenant._count.usuarios}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tenant._count.processos}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tenant._count.clientes}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(tenant.createdAt).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {tenants.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏢</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum tenant encontrado</h3>
          <p className="text-gray-500 mb-4">Os tenants aparecerão aqui quando forem criados</p>
        </div>
      )}
    </div>
  );
}
