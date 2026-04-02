
'use server';

import { CompanyData } from '@/types/cnpj';
// @ts-ignore - O SDK pode não ter tipos TS definitivos ainda
import { CnpjaOpen } from '@cnpja/sdk';

/**
 * Busca dados de uma empresa utilizando o SDK oficial da open.cnpja.com.
 * Implementado como Server Action para garantir segurança e evitar CORS.
 */
export async function fetchCompanyData(cnpj: string): Promise<CompanyData> {
  const cleanedCnpj = cnpj.replace(/\D/g, '');
  
  if (cleanedCnpj.length !== 14) {
    throw new Error('CNPJ inválido. Certifique-se de digitar 14 números.');
  }

  try {
    const cnpja = new CnpjaOpen();
    // A API gratuita da OpenCNPJA às vezes exige zeros à esquerda se o CNPJ começar com zero.
    const office = await cnpja.office.read({ taxId: cleanedCnpj });
    
    if (!office || (typeof office === 'object' && Object.keys(office).length === 0)) {
      throw new Error('Nenhum dado retornado para este CNPJ.');
    }

    return office as CompanyData;
  } catch (error: any) {
    console.error('Erro na busca de CNPJ via SDK:', error);
    
    if (error.status === 404 || error.message?.includes('not found')) {
      throw new Error('Empresa não encontrada para o CNPJ informado.');
    }
    
    if (error.status === 429) {
      throw new Error('Limite de consultas excedido pela API OpenCNPJA.');
    }

    throw new Error(error.message || 'Ocorreu um erro ao consultar a base da Receita Federal.');
  }
}
