'use server';

import { CompanyData } from '@/types/cnpj';

/**
 * Busca dados de uma empresa através do CNPJ utilizando a BrasilAPI.
 * Implementado como Server Action para evitar problemas de CORS no navegador.
 */
export async function fetchCompanyData(cnpj: string): Promise<CompanyData> {
  const cleanedCnpj = cnpj.replace(/\D/g, '');
  
  if (cleanedCnpj.length !== 14) {
    throw new Error('CNPJ inválido. Certifique-se de digitar 14 números.');
  }

  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanedCnpj}`, {
      headers: {
        'User-Agent': 'ConsultaCNPJPro/1.0',
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 } // Cache de 1 hora
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Empresa não encontrada para o CNPJ informado.');
      }
      if (response.status === 403) {
        throw new Error('O serviço de dados (BrasilAPI) recusou a conexão. Tente novamente mais tarde.');
      }
      throw new Error('O serviço de dados está temporariamente instável. Tente novamente em instantes.');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Erro na busca de CNPJ:', error);
    if (error.message.includes('fetch')) {
      throw new Error('Não foi possível conectar ao serviço de dados. Verifique sua conexão.');
    }
    throw error;
  }
}
