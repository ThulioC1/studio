'use server';

/**
 * Serviço para integração com APIs externas de geração de DANFE.
 * Utiliza o endpoint identificado na documentação enviada: /CDanfe/api_generate
 */

export async function generateDanfeFromXml(xml: string): Promise<string> {
  // Nota: O domínio base deve ser configurado de acordo com o provedor (ex: api.consultadanfe.com)
  // Como a imagem não mostra o domínio, usamos um placeholder que o usuário pode ajustar.
  const API_URL = 'https://api.consultadanfe.com/CDanfe/api_generate';

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': 'Bearer SEU_TOKEN_AQUI', // Geralmente necessário em APIs pagas
      },
      body: JSON.stringify({ codigo_xml: xml }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na API externa: ${errorText || 'Falha na comunicação'}`);
    }

    const data = await response.json();
    
    // De acordo com padrões de mercado, essas APIs retornam o PDF em Base64
    // Pode vir em campos como 'pdf_base64', 'base64' ou diretamente no objeto
    const base64 = data.pdf_base64 || data.base64 || (typeof data === 'string' ? data : null);
    
    if (!base64) {
      throw new Error('A API não retornou o conteúdo PDF esperado.');
    }

    return base64;
  } catch (error: any) {
    console.error('Erro ao integrar com API de DANFE:', error);
    throw new Error(error.message || 'Não foi possível gerar o DANFE via API externa.');
  }
}
