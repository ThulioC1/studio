
"use client"

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, FileText, Printer, ScanBarcode, AlertCircle } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function DanfeLookup() {
  const [chave, setChave] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [danfeData, setDanfeData] = useState<any | null>(null);
  
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const handleSearch = async () => {
    const cleaned = chave.replace(/\D/g, '');
    
    if (cleaned.length !== 44) {
      toast({
        variant: "destructive",
        title: "Chave inválida",
        description: "A Chave de Acesso deve conter exatamente 44 dígitos numéricos."
      });
      return;
    }

    setLoading(true);
    setError(null);
    setDanfeData(null);

    try {
      // Simulação de busca de DANFE
      // Em um cenário real, aqui seria feita uma chamada para uma API de NFe (como NFe.io ou Focus NFe)
      // Como não existe API pública gratuita de DANFE sem certificado, simulamos os dados para demonstração do PDF.
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockData = {
        chaveAcesso: cleaned,
        numero: "125.487",
        serie: "1",
        dataEmissao: new Date().toISOString().split('T')[0],
        emitente: {
          nome: "EMPRESA EXEMPLO LTDA",
          cnpj: "12.345.678/0001-90",
          endereco: "RUA DAS FLORES, 123 - CENTRO, SAO PAULO/SP - 01010-000"
        },
        destinatario: {
          nome: user?.displayName || "CLIENTE CONSUMIDOR",
          cnpj: "98.765.432/0001-21",
          endereco: "AVENIDA PAULISTA, 1000 - BELA VISTA, SAO PAULO/SP"
        },
        valorTotal: 1250.80,
        itens: [
          { descricao: "PRODUTO TECNOLOGICO A1", qtd: 2, valor: 500.00 },
          { descricao: "SERVICO DE CONSULTORIA", qtd: 1, valor: 250.80 }
        ]
      };

      setDanfeData(mockData);
      
      if (user) {
        addDoc(collection(db, 'user_profiles', user.uid, 'danfe_history'), {
          chaveAcesso: cleaned,
          timestamp: serverTimestamp()
        }).catch(() => {});
      }
    } catch (err: any) {
      setError("Não foi possível localizar os dados desta nota fiscal no momento.");
    } finally {
      setLoading(false);
    }
  };

  const formatInput = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 44);
    setChave(cleaned);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full space-y-8">
      <div className="flex flex-col items-center mb-12 print:hidden">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSearch(); }} 
          className="w-full max-w-2xl"
        >
          <div className="relative group">
            <Input
              type="text"
              placeholder="Digite a Chave de Acesso (44 dígitos)..."
              value={chave}
              onChange={(e) => formatInput(e.target.value)}
              className="h-16 pl-14 pr-32 text-lg rounded-2xl shadow-lg border-2 border-transparent focus-visible:border-accent transition-all bg-card"
            />
            <ScanBarcode className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Button 
                type="submit" 
                size="lg" 
                disabled={loading || chave.length < 44}
                className="h-10 px-6 rounded-xl font-bold"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Consultar'}
              </Button>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground text-center">
            A consulta de DANFE requer a chave de acesso presente no documento original.
          </p>
        </form>
      </div>

      <div className="max-w-4xl mx-auto">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4 bg-card rounded-2xl border border-dashed print:hidden">
            <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <p className="text-muted-foreground font-medium">Buscando nota na base da Receita Federal...</p>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="print:hidden">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro na consulta</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {danfeData && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6 print:hidden">
              <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Resultado da Consulta
              </h3>
              <Button onClick={handlePrint} variant="outline" className="gap-2">
                <Printer className="h-4 w-4" />
                Gerar PDF (DANFE)
              </Button>
            </div>

            {/* Layout Visual do DANFE para Impressão */}
            <div className="bg-white text-black p-8 border shadow-sm rounded-xl print:shadow-none print:border-black print:p-0 print:rounded-none">
              <div className="border-2 border-black p-4 mb-4">
                <div className="grid grid-cols-3 gap-4 border-b-2 border-black pb-4 mb-4">
                  <div className="col-span-1 flex flex-col justify-center items-center border-r-2 border-black pr-4">
                    <span className="text-[10px] font-bold uppercase">Recebemos de {danfeData.emitente.nome} os produtos constantes da nota fiscal indicada ao lado</span>
                    <div className="w-full mt-4 border-t border-black pt-2">
                      <span className="text-[8px] uppercase">Data de Recebimento</span>
                    </div>
                  </div>
                  <div className="col-span-1 flex flex-col justify-center items-center text-center px-4">
                    <h1 className="text-xl font-black">DANFE</h1>
                    <p className="text-[10px] font-bold">Documento Auxiliar da Nota Fiscal Eletrônica</p>
                    <div className="mt-2 text-[10px]">
                      0 - Entrada<br/>
                      1 - Saída<br/>
                      <span className="text-lg font-bold border-2 border-black px-2 mt-1 inline-block">1</span>
                    </div>
                    <p className="text-[10px] mt-2 font-bold uppercase">Nº {danfeData.numero}</p>
                    <p className="text-[10px] font-bold">SÉRIE: {danfeData.serie}</p>
                  </div>
                  <div className="col-span-1 border-l-2 border-black pl-4 flex flex-col items-center justify-center">
                    <div className="w-full bg-black h-12 mb-2 flex items-center justify-center text-white font-bold text-xs uppercase">
                      Código de Barras
                    </div>
                    <span className="text-[8px] font-bold uppercase">Chave de Acesso</span>
                    <span className="text-[9px] font-mono tracking-tighter">{danfeData.chaveAcesso}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border-b border-black pb-2">
                    <h4 className="text-[10px] font-bold uppercase bg-gray-100 p-1 mb-2">Emitente</h4>
                    <p className="text-sm font-bold">{danfeData.emitente.nome}</p>
                    <p className="text-xs">{danfeData.emitente.endereco}</p>
                    <p className="text-xs font-bold">CNPJ: {danfeData.emitente.cnpj}</p>
                  </div>

                  <div className="border-b border-black pb-2">
                    <h4 className="text-[10px] font-bold uppercase bg-gray-100 p-1 mb-2">Destinatário / Remetente</h4>
                    <p className="text-sm font-bold">{danfeData.destinatario.nome}</p>
                    <p className="text-xs">{danfeData.destinatario.endereco}</p>
                    <p className="text-xs font-bold">CNPJ/CPF: {danfeData.destinatario.cnpj}</p>
                    <p className="text-xs">Data de Emissão: {danfeData.dataEmissao}</p>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-bold uppercase bg-gray-100 p-1 mb-2">Dados dos Produtos / Serviços</h4>
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-black">
                          <th className="py-1">Descrição</th>
                          <th className="py-1">Qtd</th>
                          <th className="py-1">V. Unit</th>
                          <th className="py-1 text-right">V. Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {danfeData.itens.map((item: any, i: number) => (
                          <tr key={i} className="border-b border-gray-200">
                            <td className="py-1">{item.descricao}</td>
                            <td className="py-1">{item.qtd}</td>
                            <td className="py-1">R$ {item.valor.toFixed(2)}</td>
                            <td className="py-1 text-right font-bold">R$ {(item.qtd * item.valor).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={3} className="pt-4 text-right font-bold uppercase">Valor Total da Nota:</td>
                          <td className="pt-4 text-right font-bold text-lg">R$ {danfeData.valorTotal.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
              <p className="text-[8px] italic text-center text-gray-500 mt-4 print:block hidden">
                Este é um Documento Auxiliar da Nota Fiscal Eletrônica gerado eletronicamente em {new Date().toLocaleString('pt-BR')}.
              </p>
            </div>
          </div>
        )}

        {!danfeData && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground bg-accent/5 rounded-3xl border print:hidden">
            <ScanBarcode className="h-16 w-16 mb-4 opacity-20" />
            <p>Aguardando Chave de Acesso para consulta...</p>
          </div>
        )}
      </div>
    </div>
  );
}
