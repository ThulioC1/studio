export interface CnpjPartner {
  identificador_de_socio: number;
  nome_socio: string;
  cnpj_cpf_do_socio: string;
  qualificacao_socio: string;
}

export interface CnpjCnae {
  codigo: number;
  descricao: string;
}

export interface CompanyData {
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  descricao_situacao_cadastral: string;
  data_situacao_cadastral?: string;
  data_inicio_atividade: string;
  cnae_fiscal_descricao: string;
  cnaes_secundarios: CnpjCnae[];
  natureza_juridica: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cep: string;
  uf: string;
  municipio: string;
  capital_social: number;
  porte: string;
  qsa: CnpjPartner[];
  // Novos campos de contato
  ddd_telefone_1?: string;
  ddd_telefone_2?: string;
  email?: string;
}

export function formatCnpj(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return cnpj;
  return cleaned.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export function formatPhone(ddd?: string, phone?: string): string {
  if (!phone) return '-';
  const full = ddd ? `${ddd}${phone}` : phone;
  const cleaned = full.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return cleaned.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  } else if (cleaned.length === 11) {
    return cleaned.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  }
  return full;
}
