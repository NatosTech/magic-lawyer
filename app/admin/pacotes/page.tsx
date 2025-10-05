import { prisma } from "@/app/lib/prisma";

export default async function PacotesPage() {
  const juizes = await prisma.juiz.findMany({
    include: {
      _count: {
        select: {
          processos: true,
        },
      },
    },
  });

  // Filtrar apenas juízes premium
  const juizesPremium = juizes.filter((j) => j.isPremium && j.superAdminId !== null);

  // Calcular estatísticas
  const totalFaturamento = juizesPremium.reduce((sum, juiz) => {
    return sum + (Number(juiz.precoAcesso) || 0) * juiz._count.processos;
  }, 0);

  // Definir pacotes
  const pacotes = [
    {
      id: "gratuito",
      nome: "Pacote Gratuito",
      descricao: "Acesso a juízes públicos básicos",
      preco: 0,
      juizes: juizes.filter((j) => j.isPublico && !j.isPremium && j.superAdminId !== null).length,
      cor: "green",
      icone: "🆓",
    },
    {
      id: "premium",
      nome: "Pacote Premium",
      descricao: "Acesso a juízes especialistas premium",
      preco: 99.9,
      juizes: juizesPremium.length,
      cor: "purple",
      icone: "💎",
    },
    {
      id: "enterprise",
      nome: "Pacote Enterprise",
      descricao: "Acesso completo a todos os juízes",
      preco: 199.9,
      juizes: juizes.filter((j) => j.superAdminId !== null).length,
      cor: "blue",
      icone: "🏢",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">💎 Pacotes Premium</h1>
        <p className="text-gray-600 mt-2">Gerencie os pacotes de juízes e monetização do sistema</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Juízes Premium</p>
          <p className="text-2xl font-bold text-purple-600">{juizesPremium.length}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Faturamento Potencial</p>
          <p className="text-2xl font-bold text-green-600">R$ {totalFaturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Pacotes Ativos</p>
          <p className="text-2xl font-bold text-blue-600">3</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Tenants Premium</p>
          <p className="text-2xl font-bold text-yellow-600">0</p>
        </div>
      </div>

      {/* Pacotes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pacotes.map((pacote) => (
          <div key={pacote.id} className="bg-white p-6 rounded-lg shadow-lg border-2 border-gray-200 hover:border-gray-300 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">{pacote.icone}</span>
              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-${pacote.cor}-100 text-${pacote.cor}-800`}>{pacote.id.toUpperCase()}</span>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">{pacote.nome}</h3>

            <p className="text-gray-600 mb-4">{pacote.descricao}</p>

            <div className="flex items-baseline mb-4">
              <span className="text-3xl font-bold text-gray-900">R$ {pacote.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              <span className="text-gray-500 ml-2">/mês</span>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex items-center text-sm text-gray-600">
                <span className="mr-2">👨‍⚖️</span>
                <span>{pacote.juizes} juízes disponíveis</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="mr-2">📊</span>
                <span>Relatórios básicos</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="mr-2">💬</span>
                <span>Suporte por email</span>
              </div>
            </div>

            <button className={`w-full bg-${pacote.cor}-600 text-white py-2 px-4 rounded-lg hover:bg-${pacote.cor}-700 transition-colors`}>
              {pacote.preco === 0 ? "Gratuito" : "Configurar Preço"}
            </button>
          </div>
        ))}
      </div>

      {/* Juízes Premium Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">💎 Juízes Premium Disponíveis</h2>
          <p className="text-sm text-gray-500 mt-1">Configure os preços e disponibilidade dos juízes premium</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Juiz</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Especialidades</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço Atual</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acessos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faturamento</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {juizesPremium.map((juiz) => (
                <tr key={juiz.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{juiz.nome}</div>
                      {juiz.nomeCompleto && <div className="text-sm text-gray-500">{juiz.nomeCompleto}</div>}
                      <div className="text-xs text-gray-400">
                        {juiz.comarca} - {juiz.vara}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {juiz.especialidades.slice(0, 2).map((esp, index) => (
                        <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                          {esp.replace("_", " ")}
                        </span>
                      ))}
                      {juiz.especialidades.length > 2 && <span className="text-xs text-gray-500">+{juiz.especialidades.length - 2}</span>}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">R$ {Number(juiz.precoAcesso).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                    <div className="text-xs text-gray-500">por acesso</div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <span className="font-medium">{juiz._count.processos}</span>
                      <div className="text-xs text-gray-500">processos</div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <span className="font-medium text-green-600">R$ {((Number(juiz.precoAcesso) || 0) * juiz._count.processos).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                      <div className="text-xs text-gray-500">potencial</div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {juizesPremium.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💎</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum juiz premium encontrado</h3>
          <p className="text-gray-500 mb-4">Configure juízes como premium para criar pacotes pagos</p>
          <a href="/admin/juizes" className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
            👨‍⚖️ Gerenciar Juízes
          </a>
        </div>
      )}
    </div>
  );
}
