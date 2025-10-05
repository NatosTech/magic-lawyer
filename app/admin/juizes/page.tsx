import { prisma } from "@/app/lib/prisma";

export default async function JuizesPage() {
  const juizes = await prisma.juiz.findMany({
    include: {
      tribunal: {
        select: {
          nome: true,
          sigla: true,
        },
      },
      _count: {
        select: {
          processos: true,
          julgamentos: true,
        },
      },
    },
    orderBy: [{ isPublico: "desc" }, { createdAt: "desc" }],
  });

  // Separar juízes globais dos privados
  const juizesGlobais = juizes.filter((j) => j.superAdminId !== null);
  const juizesPrivados = juizes.filter((j) => j.superAdminId === null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">👨‍⚖️ Gerenciar Juízes Globais</h1>
          <p className="text-gray-600 mt-2">Administre os juízes públicos e pacotes premium do sistema</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Total de Juízes</p>
          <p className="text-2xl font-bold text-gray-900">{juizes.length}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Juízes Globais</p>
          <p className="text-2xl font-bold text-blue-600">{juizesGlobais.length}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Públicos</p>
          <p className="text-2xl font-bold text-green-600">{juizesGlobais.filter((j) => j.isPublico).length}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Premium</p>
          <p className="text-2xl font-bold text-purple-600">{juizesGlobais.filter((j) => j.isPremium).length}</p>
        </div>
      </div>

      {/* Juízes Globais Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">🌐 Juízes Globais (Controlados pelo SuperAdmin)</h2>
          <p className="text-sm text-gray-500 mt-1">Estes juízes são visíveis para todos os tenants e podem ser vendidos como pacotes premium</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Juiz</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comarca/Vara</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Especialidades</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Processos</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {juizesGlobais.map((juiz) => (
                <tr key={juiz.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{juiz.nome}</div>
                      {juiz.nomeCompleto && <div className="text-sm text-gray-500">{juiz.nomeCompleto}</div>}
                      <div className="text-xs text-gray-400">{juiz.nivel.replace("_", " ")}</div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{juiz.comarca}</div>
                    {juiz.vara && <div className="text-sm text-gray-500">{juiz.vara}</div>}
                    {juiz.tribunal && <div className="text-xs text-blue-600">{juiz.tribunal.nome}</div>}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {juiz.especialidades.slice(0, 2).map((esp, index) => (
                        <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          {esp.replace("_", " ")}
                        </span>
                      ))}
                      {juiz.especialidades.length > 2 && <span className="text-xs text-gray-500">+{juiz.especialidades.length - 2}</span>}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${juiz.status === "ATIVO" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                        {juiz.status === "ATIVO" ? "✅ Ativo" : "❌ Inativo"}
                      </span>

                      <div className="flex gap-1">
                        {juiz.isPublico && <span className="inline-flex px-1 py-0.5 text-xs bg-green-100 text-green-700 rounded">🌐 Público</span>}
                        {juiz.isPremium && <span className="inline-flex px-1 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">💎 Premium</span>}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {juiz.isPremium && juiz.precoAcesso ? (
                      <div>
                        <span className="font-medium">R$ {Number(juiz.precoAcesso).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                        <div className="text-xs text-gray-500">por acesso</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">Gratuito</span>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <span className="font-medium">{juiz._count.processos}</span>
                      <div className="text-xs text-gray-500">processos</div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {juizesGlobais.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👨‍⚖️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum juiz global encontrado</h3>
          <p className="text-gray-500 mb-4">Os juízes globais aparecerão aqui quando forem criados</p>
        </div>
      )}
    </div>
  );
}
