/**
 * Formata CPF para exibição (000.000.000-00)
 */
export function formatarCpf(cpf: string): string {
  const cpfLimpo = cpf.replace(/\D/g, "");

  if (cpfLimpo.length === 11) {
    return `${cpfLimpo.slice(0, 3)}.${cpfLimpo.slice(3, 6)}.${cpfLimpo.slice(6, 9)}-${cpfLimpo.slice(9)}`;
  }

  return cpf;
}

/**
 * Valida se o CPF é válido (algoritmo oficial)
 */
export function validarCpf(cpf: string): boolean {
  const cpfLimpo = cpf.replace(/\D/g, "");

  // Verifica se tem 11 dígitos
  if (cpfLimpo.length !== 11) {
    return false;
  }

  // Verifica se não são todos dígitos iguais
  if (/^(\d)\1{10}$/.test(cpfLimpo)) {
    return false;
  }

  // Valida primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.charAt(9))) {
    return false;
  }

  // Valida segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.charAt(10))) {
    return false;
  }

  return true;
}

/**
 * Remove formatação do CPF
 */
export function limparCpf(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

