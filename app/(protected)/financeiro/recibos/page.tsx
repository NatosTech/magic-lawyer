"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Divider,
  Skeleton,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Input,
  Select,
  SelectItem,
  DatePicker,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import { 
  Download, 
  Search, 
  Filter, 
  FileText, 
  Calendar,
  DollarSign,
  User,
  Building,
  CreditCard,
  Smartphone,
  Receipt
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { title, subtitle } from "@/components/primitives";
import { PermissionGuard } from "@/components/permission-guard";
import { getRecibosPagos, getReciboDetalhes, gerarComprovantePDF, type FiltrosRecibos, type Recibo } from "@/app/actions/recibos";
import useSWR from "swr";

export default function RecibosPage() {
  const [filtros, setFiltros] = useState<FiltrosRecibos>({});
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [reciboSelecionado, setReciboSelecionado] = useState<Recibo | null>(null);
  const [carregandoPDF, setCarregandoPDF] = useState(false);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const itensPorPagina = 10;

  // Buscar recibos com SWR
  const { data: recibosData, error, isLoading, mutate } = useSWR(
    ['recibos', filtros],
    () => getRecibosPagos(filtros),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  const recibos = recibosData?.data?.recibos || [];
  const resumo = recibosData?.data?.resumo;
  const total = recibosData?.data?.total || 0;

  // Paginação
  const totalPaginas = Math.ceil(total / itensPorPagina);
  const recibosPaginados = recibos.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  const handleFiltroChange = (key: keyof FiltrosRecibos, value: any) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
    setPaginaAtual(1);
  };

  const limparFiltros = () => {
    setFiltros({});
    setPaginaAtual(1);
  };

  const abrirModalRecibo = async (recibo: Recibo) => {
    setReciboSelecionado(recibo);
    onOpen();
  };

  const gerarPDF = async (recibo: Recibo) => {
    setCarregandoPDF(true);
    try {
      // Abrir PDF em nova aba
      const pdfUrl = `/api/recibos/${recibo.id}/pdf?tipo=${recibo.tipo}`;
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    } finally {
      setCarregandoPDF(false);
    }
  };

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const formatarData = (data: Date | null) => {
    if (!data) return '-';
    return format(new Date(data), 'dd/MM/yyyy', { locale: ptBR });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAGA':
        return 'success';
      case 'PENDENTE':
        return 'warning';
      case 'ATRASADA':
        return 'danger';
      case 'CANCELADA':
        return 'default';
      default:
        return 'default';
    }
  };

  const getFormaPagamentoIcon = (forma: string | null) => {
    switch (forma) {
      case 'PIX':
        return <Smartphone className="w-4 h-4" />;
      case 'CREDIT_CARD':
        return <CreditCard className="w-4 h-4" />;
      case 'BOLETO':
        return <Receipt className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  if (error) {
    return (
      <PermissionGuard permission="canViewFinancialData">
        <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 py-12">
          <div className="text-center">
            <h1 className={title({ size: "lg", color: "red" })}>
              Erro ao carregar recibos
            </h1>
            <p className={subtitle({ fullWidth: true })}>
              {error.message || "Ocorreu um erro inesperado"}
            </p>
            <Button 
              color="primary" 
              onPress={() => mutate()}
              className="mt-4"
            >
              Tentar novamente
            </Button>
          </div>
        </section>
      </PermissionGuard>
    );
  }

  return (
    <PermissionGuard permission="canViewFinancialData">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 py-12">
        <header className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            Comprovantes e recibos
          </p>
          <h1 className={title({ size: "lg", color: "blue" })}>
            Histórico de pagamentos confirmados
          </h1>
          <p className={subtitle({ fullWidth: true })}>
            Visualize e baixe comprovantes de todas as parcelas e faturas pagas
          </p>
        </header>

        {/* Resumo */}
        {resumo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <Card className="border border-success/20 bg-success/5">
              <CardBody className="flex flex-row items-center gap-3">
                <div className="p-2 rounded-full bg-success/20">
                  <DollarSign className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-success/80">Total Recebido</p>
                  <p className="text-lg font-semibold text-success">
                    {formatarValor(resumo.totalValor)}
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card className="border border-primary/20 bg-primary/5">
              <CardBody className="flex flex-row items-center gap-3">
                <div className="p-2 rounded-full bg-primary/20">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-primary/80">Total Recibos</p>
                  <p className="text-lg font-semibold text-primary">
                    {total}
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card className="border border-warning/20 bg-warning/5">
              <CardBody className="flex flex-row items-center gap-3">
                <div className="p-2 rounded-full bg-warning/20">
                  <Receipt className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-warning/80">Parcelas</p>
                  <p className="text-lg font-semibold text-warning">
                    {resumo.totalParcelas}
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card className="border border-secondary/20 bg-secondary/5">
              <CardBody className="flex flex-row items-center gap-3">
                <div className="p-2 rounded-full bg-secondary/20">
                  <Building className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-secondary/80">Faturas</p>
                  <p className="text-lg font-semibold text-secondary">
                    {resumo.totalFaturas}
                  </p>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        )}

        {/* Filtros */}
        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Filtros</h3>
            </div>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                placeholder="Buscar por número, cliente..."
                value={filtros.search || ''}
                onValueChange={(value) => handleFiltroChange('search', value)}
                startContent={<Search className="w-4 h-4" />}
                size="sm"
              />

              <Select
                placeholder="Tipo"
                selectedKeys={filtros.tipo ? [filtros.tipo] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  handleFiltroChange('tipo', selected || undefined);
                }}
                size="sm"
              >
                <SelectItem key="TODOS" value="TODOS">Todos</SelectItem>
                <SelectItem key="PARCELA" value="PARCELA">Parcelas</SelectItem>
                <SelectItem key="FATURA" value="FATURA">Faturas</SelectItem>
              </Select>

              <Select
                placeholder="Status"
                selectedKeys={filtros.status ? [filtros.status] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  handleFiltroChange('status', selected || undefined);
                }}
                size="sm"
              >
                <SelectItem key="PAGA" value="PAGA">Paga</SelectItem>
                <SelectItem key="PENDENTE" value="PENDENTE">Pendente</SelectItem>
                <SelectItem key="ATRASADA" value="ATRASADA">Atrasada</SelectItem>
                <SelectItem key="CANCELADA" value="CANCELADA">Cancelada</SelectItem>
              </Select>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="bordered"
                  onPress={limparFiltros}
                >
                  Limpar
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Lista de Recibos */}
        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Recibos Pagos</h3>
              </div>
              <Chip color="primary" variant="flat">
                {total} registros
              </Chip>
            </div>
          </CardHeader>
          <Divider />
          <CardBody>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : recibosPaginados.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-default-300 mb-4" />
                <h3 className="text-lg font-semibold text-default-500 mb-2">
                  Nenhum recibo encontrado
                </h3>
                <p className="text-default-400">
                  Não há recibos pagos que correspondam aos filtros selecionados
                </p>
              </div>
            ) : (
              <>
                <Table aria-label="Lista de recibos">
                  <TableHeader>
                    <TableColumn>RECIBO</TableColumn>
                    <TableColumn>CLIENTE</TableColumn>
                    <TableColumn>VALOR</TableColumn>
                    <TableColumn>PAGAMENTO</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                    <TableColumn>AÇÕES</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {recibosPaginados.map((recibo) => (
                      <TableRow key={recibo.id}>
                        <TableCell>
                          <div>
                            <p className="font-semibold">{recibo.numero}</p>
                            <p className="text-sm text-default-500">
                              {recibo.titulo}
                            </p>
                            <Chip
                              size="sm"
                              color={recibo.tipo === 'PARCELA' ? 'primary' : 'secondary'}
                              variant="flat"
                            >
                              {recibo.tipo}
                            </Chip>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold">
                              {recibo.contrato?.cliente.nome || 'N/A'}
                            </p>
                            <p className="text-sm text-default-500">
                              {recibo.contrato?.numero || 'N/A'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-semibold text-success">
                            {formatarValor(recibo.valor)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {recibo.tipo === 'PARCELA' && recibo.formaPagamento && (
                              <div className="flex items-center gap-1">
                                {getFormaPagamentoIcon(recibo.formaPagamento)}
                                <span className="text-sm">
                                  {recibo.formaPagamento}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="text-sm">
                                {formatarData(recibo.dataPagamento)}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="sm"
                            color={getStatusColor(recibo.status)}
                            variant="flat"
                          >
                            {recibo.status}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="bordered"
                              onPress={() => abrirModalRecibo(recibo)}
                            >
                              Ver
                            </Button>
                            <Button
                              size="sm"
                              color="primary"
                              startContent={<Download className="w-4 h-4" />}
                              onPress={() => gerarPDF(recibo)}
                              isLoading={carregandoPDF}
                            >
                              PDF
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {totalPaginas > 1 && (
                  <div className="flex justify-center mt-6">
                    <Pagination
                      total={totalPaginas}
                      page={paginaAtual}
                      onChange={setPaginaAtual}
                      showControls
                      showShadow
                    />
                  </div>
                )}
              </>
            )}
          </CardBody>
        </Card>

        {/* Modal de Detalhes do Recibo */}
        <Modal isOpen={isOpen} onClose={onClose} size="2xl">
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  <h3 className="text-lg font-semibold">
                    Detalhes do Recibo
                  </h3>
                  {reciboSelecionado && (
                    <p className="text-sm text-default-500">
                      {reciboSelecionado.numero} - {reciboSelecionado.titulo}
                    </p>
                  )}
                </ModalHeader>
                <ModalBody>
                  {reciboSelecionado && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-semibold text-default-600">Tipo</p>
                          <Chip
                            color={reciboSelecionado.tipo === 'PARCELA' ? 'primary' : 'secondary'}
                            variant="flat"
                          >
                            {reciboSelecionado.tipo}
                          </Chip>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-default-600">Status</p>
                          <Chip
                            color={getStatusColor(reciboSelecionado.status)}
                            variant="flat"
                          >
                            {reciboSelecionado.status}
                          </Chip>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-semibold text-default-600">Valor</p>
                          <p className="text-lg font-semibold text-success">
                            {formatarValor(reciboSelecionado.valor)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-default-600">Data de Pagamento</p>
                          <p className="text-sm">
                            {formatarData(reciboSelecionado.dataPagamento)}
                          </p>
                        </div>
                      </div>

                      {reciboSelecionado.contrato && (
                        <div>
                          <p className="text-sm font-semibold text-default-600">Cliente</p>
                          <div className="bg-default-50 p-3 rounded-lg">
                            <p className="font-semibold">
                              {reciboSelecionado.contrato.cliente.nome}
                            </p>
                            <p className="text-sm text-default-500">
                              {reciboSelecionado.contrato.cliente.documento}
                            </p>
                            <p className="text-sm text-default-500">
                              {reciboSelecionado.contrato.cliente.email}
                            </p>
                          </div>
                        </div>
                      )}

                      {reciboSelecionado.tipo === 'PARCELA' && reciboSelecionado.formaPagamento && (
                        <div>
                          <p className="text-sm font-semibold text-default-600">Forma de Pagamento</p>
                          <div className="flex items-center gap-2">
                            {getFormaPagamentoIcon(reciboSelecionado.formaPagamento)}
                            <span>{reciboSelecionado.formaPagamento}</span>
                          </div>
                        </div>
                      )}

                      {reciboSelecionado.descricao && (
                        <div>
                          <p className="text-sm font-semibold text-default-600">Descrição</p>
                          <p className="text-sm">{reciboSelecionado.descricao}</p>
                        </div>
                      )}
                    </div>
                  )}
                </ModalBody>
                <ModalFooter>
                  <Button variant="light" onPress={onClose}>
                    Fechar
                  </Button>
                  {reciboSelecionado && (
                    <Button
                      color="primary"
                      startContent={<Download className="w-4 h-4" />}
                      onPress={() => {
                        gerarPDF(reciboSelecionado);
                        onClose();
                      }}
                      isLoading={carregandoPDF}
                    >
                      Baixar PDF
                    </Button>
                  )}
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </section>
    </PermissionGuard>
  );
}
