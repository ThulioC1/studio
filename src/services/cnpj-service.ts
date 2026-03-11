import { CompanyData } from '@/types/cnpj';

export async function fetchCompanyData(cnpj: string): Promise<CompanyData> {
  const cleanedCnpj = cnpj.replace(/\D/g, '');
  
  if (cleanedCnpj.length !== 14) {
    throw new Error('CNPJ inválido. Certifique-se de digitar 14 números.');
  }

  const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanedCnpj}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Empresa não encontrada para o CNPJ informado.');
    }
    throw new Error('Erro ao buscar dados do CNPJ. Tente novamente mais tarde.');
  }

  return response.json();
}