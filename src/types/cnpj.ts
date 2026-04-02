
export interface CnpjPartner {
  name: string;
  role: {
    text: string;
  };
}

export interface CnpjActivity {
  text: string;
  id?: string;
}

export interface CompanyData {
  taxId: string;
  alias?: string;
  founded: string;
  updated: string;
  status: {
    text: string;
    date: string;
  };
  // Dados aninhados conforme PowerShell
  company: {
    id: string | number;
    name: string;
    equity: number;
    nature?: {
      text: string;
    };
    size?: {
      text: string;
    };
    members: CnpjPartner[];
  };
  address: {
    street: string;
    number: string;
    details?: string;
    district: string;
    city: string;
    state: string;
    zip: string;
    country?: {
      name: string;
    };
  };
  phones: Array<{
    area: string;
    number: string;
  }>;
  emails: Array<{
    address: string;
  }>;
  mainActivity: CnpjActivity;
  sideActivities: CnpjActivity[];
}

export function formatCnpj(cnpj: string): string {
  if (!cnpj) return '-';
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return cnpj;
  return cleaned.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

export function formatCurrency(value: number): string {
  if (value === undefined || value === null) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
}

export function formatPhone(area?: string, number?: string): string {
  if (!number) return '-';
  const full = area ? `${area}${number}` : number;
  const cleaned = full.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return cleaned.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  } else if (cleaned.length === 11) {
    return cleaned.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  }
  return full;
}
