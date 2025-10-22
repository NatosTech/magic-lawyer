"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Tabs,
  Tab,
  Chip,
  Avatar,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
  Select,
  SelectItem,
  Switch,
  Badge,
  Tooltip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Spinner,
} from "@heroui/react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  LinkIcon,
  EyeIcon,
  MoreVerticalIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  getCargos,
  getUsuariosEquipe,
  getDashboardEquipe,
  createCargo,
  updateCargo,
  deleteCargo,
  atribuirCargoUsuario,
  vincularUsuarioAdvogado,
  desvincularUsuarioAdvogado,
  adicionarPermissaoIndividual,
  type CargoData,
  type UsuarioEquipeData,
} from "@/app/actions/equipe";
import { getAdvogados } from "@/app/actions/advogados";

// ===== COMPONENTES =====

function DashboardEquipe() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const data = await getDashboardEquipe();
        setDashboardData(data);
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
        toast.error("Erro ao carregar dados do dashboard");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!dashboardData) {
    return <div>Erro ao carregar dashboard</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardBody className="flex flex-row items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <UserGroupIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-default-500">Total de Usuários</p>
            <p className="text-2xl font-bold">{dashboardData.totalUsuarios}</p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-row items-center gap-3">
          <div className="p-2 bg-success/10 rounded-lg">
            <ShieldCheckIcon className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-sm text-default-500">Cargos Ativos</p>
            <p className="text-2xl font-bold">{dashboardData.totalCargos}</p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-row items-center gap-3">
          <div className="p-2 bg-warning/10 rounded-lg">
            <LinkIcon className="w-6 h-6 text-warning" />
          </div>
          <div>
            <p className="text-sm text-default-500">Vinculações Ativas</p>
            <p className="text-2xl font-bold">{dashboardData.vinculacoesAtivas}</p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-row items-center gap-3">
          <div className="p-2 bg-secondary/10 rounded-lg">
            <EyeIcon className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <p className="text-sm text-default-500">Permissões Individuais</p>
            <p className="text-2xl font-bold">{dashboardData.permissoesIndividuais}</p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function CargosTab() {
  const [cargos, setCargos] = useState<CargoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCargo, setEditingCargo] = useState<CargoData | null>(null);

  const modulos = [
    { key: "processos", label: "Processos" },
    { key: "clientes", label: "Clientes" },
    { key: "advogados", label: "Advogados" },
    { key: "financeiro", label: "Financeiro" },
    { key: "equipe", label: "Equipe" },
    { key: "relatorios", label: "Relatórios" },
  ];

  const acoes = [
    { key: "visualizar", label: "Visualizar" },
    { key: "criar", label: "Criar" },
    { key: "editar", label: "Editar" },
    { key: "excluir", label: "Excluir" },
    { key: "exportar", label: "Exportar" },
  ];

  useEffect(() => {
    loadCargos();
  }, []);

  async function loadCargos() {
    try {
      setLoading(true);
      const data = await getCargos();
      setCargos(data);
    } catch (error) {
      console.error("Erro ao carregar cargos:", error);
      toast.error("Erro ao carregar cargos");
    } finally {
      setLoading(false);
    }
  }

  function handleEditCargo(cargo: CargoData) {
    setEditingCargo(cargo);
    setModalOpen(true);
  }

  function handleDeleteCargo(cargoId: string) {
    if (confirm("Tem certeza que deseja excluir este cargo?")) {
      deleteCargo(cargoId)
        .then(() => {
          toast.success("Cargo excluído com sucesso");
          loadCargos();
        })
        .catch((error) => {
          console.error("Erro ao excluir cargo:", error);
          toast.error("Erro ao excluir cargo");
        });
    }
  }

  function getNivelLabel(nivel: number) {
    const niveis = {
      1: "Estagiário",
      2: "Assistente", 
      3: "Advogado",
      4: "Coordenador",
      5: "Diretor",
    };
    return niveis[nivel as keyof typeof niveis] || "Nível " + nivel;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Cargos</h2>
        <Button
          color="primary"
          startContent={<PlusIcon className="w-4 h-4" />}
          onPress={() => {
            setEditingCargo(null);
            setModalOpen(true);
          }}
        >
          Novo Cargo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cargos.map((cargo) => (
          <Card key={cargo.id}>
            <CardHeader className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{cargo.nome}</h3>
                <Chip
                  size="sm"
                  color={cargo.ativo ? "success" : "default"}
                  variant="flat"
                >
                  {getNivelLabel(cargo.nivel)}
                </Chip>
              </div>
              <Dropdown>
                <DropdownTrigger>
                  <Button isIconOnly size="sm" variant="light">
                    <MoreVerticalIcon className="w-4 h-4" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu>
                  <DropdownItem
                    key="edit"
                    startContent={<PencilIcon className="w-4 h-4" />}
                    onPress={() => handleEditCargo(cargo)}
                  >
                    Editar
                  </DropdownItem>
                  <DropdownItem
                    key="delete"
                    className="text-danger"
                    color="danger"
                    startContent={<TrashIcon className="w-4 h-4" />}
                    onPress={() => handleDeleteCargo(cargo.id)}
                  >
                    Excluir
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </CardHeader>
            <CardBody>
              {cargo.descricao && (
                <p className="text-sm text-default-500 mb-3">{cargo.descricao}</p>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-default-500">
                  {cargo.usuariosCount} usuário(s)
                </span>
                <Badge content={cargo.permissoes.length} color="primary">
                  <Chip size="sm" variant="flat">
                    Permissões
                  </Chip>
                </Badge>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {cargos.length === 0 && (
        <Card>
          <CardBody className="text-center py-8">
            <UserGroupIcon className="w-12 h-12 text-default-300 mx-auto mb-4" />
            <p className="text-default-500">Nenhum cargo encontrado</p>
            <p className="text-sm text-default-400">
              Crie o primeiro cargo para começar a organizar sua equipe
            </p>
          </CardBody>
        </Card>
      )}

      <CargoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        cargo={editingCargo}
        onSuccess={() => {
          setModalOpen(false);
          loadCargos();
        }}
        modulos={modulos}
        acoes={acoes}
      />
    </div>
  );
}

function CargoModal({
  isOpen,
  onClose,
  cargo,
  onSuccess,
  modulos,
  acoes,
}: {
  isOpen: boolean;
  onClose: () => void;
  cargo: CargoData | null;
  onSuccess: () => void;
  modulos: { key: string; label: string }[];
  acoes: { key: string; label: string }[];
}) {
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    nivel: 1,
    ativo: true,
    permissoes: [] as { modulo: string; acao: string; permitido: boolean }[],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cargo) {
      setFormData({
        nome: cargo.nome,
        descricao: cargo.descricao || "",
        nivel: cargo.nivel,
        ativo: cargo.ativo,
        permissoes: cargo.permissoes.map(p => ({
          modulo: p.modulo,
          acao: p.acao,
          permitido: p.permitido,
        })),
      });
    } else {
      setFormData({
        nome: "",
        descricao: "",
        nivel: 1,
        ativo: true,
        permissoes: [],
      });
    }
  }, [cargo, isOpen]);

  function togglePermissao(modulo: string, acao: string) {
    const existingIndex = formData.permissoes.findIndex(
      p => p.modulo === modulo && p.acao === acao
    );

    if (existingIndex >= 0) {
      const newPermissoes = [...formData.permissoes];
      newPermissoes[existingIndex].permitido = !newPermissoes[existingIndex].permitido;
      setFormData({ ...formData, permissoes: newPermissoes });
    } else {
      setFormData({
        ...formData,
        permissoes: [
          ...formData.permissoes,
          { modulo, acao, permitido: true },
        ],
      });
    }
  }

  function hasPermissao(modulo: string, acao: string) {
    const permissao = formData.permissoes.find(
      p => p.modulo === modulo && p.acao === acao
    );
    return permissao?.permitido || false;
  }

  async function handleSubmit() {
    try {
      setLoading(true);

      if (cargo) {
        await updateCargo(cargo.id, formData);
        toast.success("Cargo atualizado com sucesso");
      } else {
        await createCargo(formData);
        toast.success("Cargo criado com sucesso");
      }

      onSuccess();
    } catch (error) {
      console.error("Erro ao salvar cargo:", error);
      toast.error("Erro ao salvar cargo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>
          {cargo ? "Editar Cargo" : "Novo Cargo"}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Input
              label="Nome do Cargo"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              isRequired
            />

            <Textarea
              label="Descrição"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descreva as responsabilidades do cargo..."
            />

            <Select
              label="Nível"
              selectedKeys={[formData.nivel.toString()]}
              onSelectionChange={(keys) => {
                const nivel = parseInt(Array.from(keys)[0] as string);
                setFormData({ ...formData, nivel });
              }}
            >
              <SelectItem key="1" value="1">Estagiário</SelectItem>
              <SelectItem key="2" value="2">Assistente</SelectItem>
              <SelectItem key="3" value="3">Advogado</SelectItem>
              <SelectItem key="4" value="4">Coordenador</SelectItem>
              <SelectItem key="5" value="5">Diretor</SelectItem>
            </Select>

            <Switch
              isSelected={formData.ativo}
              onValueChange={(checked) => setFormData({ ...formData, ativo: checked })}
            >
              Cargo ativo
            </Switch>

            <div>
              <h4 className="text-lg font-semibold mb-3">Permissões</h4>
              <div className="space-y-4">
                {modulos.map((modulo) => (
                  <div key={modulo.key}>
                    <h5 className="font-medium mb-2">{modulo.label}</h5>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {acoes.map((acao) => (
                        <div key={acao.key} className="flex items-center gap-2">
                          <Switch
                            size="sm"
                            isSelected={hasPermissao(modulo.key, acao.key)}
                            onValueChange={() => togglePermissao(modulo.key, acao.key)}
                          />
                          <span className="text-sm">{acao.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancelar
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={loading}
            isDisabled={!formData.nome.trim()}
          >
            {cargo ? "Atualizar" : "Criar"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function UsuariosTab() {
  const [usuarios, setUsuarios] = useState<UsuarioEquipeData[]>([]);
  const [advogados, setAdvogados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [usuariosData, advogadosData] = await Promise.all([
        getUsuariosEquipe(),
        getAdvogados(),
      ]);
      setUsuarios(usuariosData);
      setAdvogados(advogadosData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  function getRoleColor(role: string) {
    const colors = {
      ADMIN: "danger",
      ADVOGADO: "primary",
      SECRETARIA: "secondary",
      CLIENTE: "default",
    };
    return colors[role as keyof typeof colors] || "default";
  }

  function getRoleLabel(role: string) {
    const labels = {
      ADMIN: "Administrador",
      ADVOGADO: "Advogado",
      SECRETARIA: "Secretária",
      CLIENTE: "Cliente",
    };
    return labels[role as keyof typeof labels] || role;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Usuários da Equipe</h2>
      </div>

      <Table aria-label="Usuários da equipe">
        <TableHeader>
          <TableColumn>USUÁRIO</TableColumn>
          <TableColumn>ROLE</TableColumn>
          <TableColumn>CARGOS</TableColumn>
          <TableColumn>VINCULAÇÕES</TableColumn>
          <TableColumn>STATUS</TableColumn>
          <TableColumn>AÇÕES</TableColumn>
        </TableHeader>
        <TableBody>
          {usuarios.map((usuario) => (
            <TableRow key={usuario.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar
                    src={usuario.avatarUrl}
                    name={usuario.firstName || usuario.email}
                    size="sm"
                  />
                  <div>
                    <p className="font-medium">
                      {usuario.firstName && usuario.lastName
                        ? `${usuario.firstName} ${usuario.lastName}`
                        : usuario.email}
                    </p>
                    <p className="text-sm text-default-500">{usuario.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Chip
                  size="sm"
                  color={getRoleColor(usuario.role)}
                  variant="flat"
                >
                  {getRoleLabel(usuario.role)}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {usuario.cargos.map((cargo) => (
                    <Chip key={cargo.id} size="sm" variant="flat">
                      {cargo.nome}
                    </Chip>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {usuario.vinculacoes.map((vinculacao) => (
                    <Tooltip key={vinculacao.id} content={vinculacao.observacoes}>
                      <Chip size="sm" variant="flat" color="primary">
                        {vinculacao.tipo} → {vinculacao.advogadoNome}
                      </Chip>
                    </Tooltip>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <Chip
                  size="sm"
                  color={usuario.active ? "success" : "default"}
                  variant="flat"
                >
                  {usuario.active ? "Ativo" : "Inativo"}
                </Chip>
              </TableCell>
              <TableCell>
                <Dropdown>
                  <DropdownTrigger>
                    <Button isIconOnly size="sm" variant="light">
                      <MoreVerticalIcon className="w-4 h-4" />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu>
                    <DropdownItem key="view">
                      <EyeIcon className="w-4 h-4" />
                      Visualizar
                    </DropdownItem>
                    <DropdownItem key="edit">
                      <PencilIcon className="w-4 h-4" />
                      Editar
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {usuarios.length === 0 && (
        <Card>
          <CardBody className="text-center py-8">
            <UserGroupIcon className="w-12 h-12 text-default-300 mx-auto mb-4" />
            <p className="text-default-500">Nenhum usuário encontrado</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

// ===== COMPONENTE PRINCIPAL =====

export default function EquipeContent() {
  return (
    <div>
      <DashboardEquipe />
      
      <Card>
        <CardBody>
          <Tabs aria-label="Gestão de Equipe">
            <Tab key="cargos" title="Cargos">
              <CargosTab />
            </Tab>
            <Tab key="usuarios" title="Usuários">
              <UsuariosTab />
            </Tab>
          </Tabs>
        </CardBody>
      </Card>
    </div>
  );
}
