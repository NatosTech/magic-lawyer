export interface EnderecoFormData {
  id?: string;
  apelido: string;
  tipo: string;
  principal: boolean;
  logradouro: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade: string;
  estado: string;
  cep?: string;
  pais?: string;
  telefone?: string;
  observacoes?: string;
}

export interface DadosBancariosFormData {
  tipoConta: "PESSOA_FISICA" | "PESSOA_JURIDICA";
  bancoCodigo: string;
  agencia: string;
  conta: string;
  digitoConta?: string;
  tipoContaBancaria: "CORRENTE" | "POUPANCA" | "SALARIO" | "INVESTIMENTO";
  chavePix?: string;
  tipoChavePix?: "CPF" | "CNPJ" | "EMAIL" | "TELEFONE" | "ALEATORIA";
  titularNome: string;
  titularDocumento: string;
  titularEmail?: string;
  titularTelefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  principal: boolean;
  observacoes?: string;
}
