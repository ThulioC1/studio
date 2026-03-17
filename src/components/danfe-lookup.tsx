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
import { generateBarcode128C } from '@/lib/barcode-utils';

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
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockData = {
        chaveAcesso: cleaned,
        numero: "352.223",
        serie: "002",
        folha: "1/1",
        dataEmissao: "16/03/2026",
        naturezaOperacao: "Venda Merc Terc Outro Estado",
        protocoloAutorizacao: "242260118482056 - 16/03/2026 14:57:27",
        inscricaoEstadual: "256042942",
        inscricaoMunicipal: "98214",
        emitente: {
          nome: "BAZAM E PICHAU INFORMATICA LTDA",
          cnpj: "09.376.495/0001-22",
          endereco: "AV SANTOS DUMONT, 7199 - 7199",
          bairro: "AVENTUREIRO",
          cidade: "Joinville - SC",
          cep: "89226-435",
          fone: "(47) 3327-7636"
        },
        destinatario: {
          nome: "THULIO COSTA",
          cnpjCpf: "47.636.037/0001-74",
          endereco: "RUA OTACILIO NEPOMUCENO, 600 - 500 AMLMF",
          bairro: "CATOLE",
          cep: "58410-160",
          cidade: "Campina Grande",
          uf: "PB",
          fone: "83993662978",
          ie: "ISENTO"
        },
        impostos: {
          bcIcms: "2.357,22",
          vIcms: "165,00",
          bcIcmsSt: "0,00",
          vIcmsSt: "0,00",
          vProd: "2.092,49",
          vFrete: "67,25",
          vSeguro: "0,00",
          vDesc: "0,00",
          vOutros: "0,00",
          vIpi: "197,46",
          vTotTrib: "573,68",
          vNota: "2.357,22"
        },
        transportador: {
          razaoSocial: "BRASPRESS TRANSPORTES URGENTES LTDA",
          fretePorConta: "0-Por conta do Rem",
          cnpjCpf: "48.740.351/0022-90",
          placa: "ABC-1234",
          ufVeiculo: "SP",
          ie: "254999514",
          endereco: "Rua Copacabana",
          municipio: "JOINVILLE",
          uf: "SC"
        },
        volumes: {
          quantidade: "2",
          especie: "CAIXAS",
          pesoBruto: "8,800",
          pesoLiquido: "8,800"
        },
        itens: [
          { cod: "51621", desc: "Processador Intel Core i3-12100F, 4-Core, 8-Threads, 3.3GHz", ncm: "85423190", cst: "700", cfop: "6108", un: "UN", qtd: "1,0000", vUnit: "499,4600", vTotal: "499,46", bcIcms: "524,41", vIcms: "36,71", vIpi: "9,99", aliqIcms: "7,00", aliqIpi: "2,00" },
          { cod: "99812", desc: "Memória Gamer 16GB DDR4 3200MHz RGB", ncm: "84733042", cst: "000", cfop: "6102", un: "UN", qtd: "2,0000", vUnit: "299,0000", vTotal: "598,00", bcIcms: "598,00", vIcms: "107,64", vIpi: "0,00", aliqIcms: "18,00", aliqIpi: "0,00" }
        ],
        infoComplementar: "Inf. Contribuinte: A base de calculo sera reduzida , onforme: Artigo 33, inciso IX, do RICMS/PB|A base de calculo sera reduzida , onforme: Artigo 33, inciso IX, do RICMS/PB|A base de calculo sera reduzida , onforme: Artigo 33, inciso IX, do RICMS/PB|PEDIDO: 1012991460|A aceitacao desta mercadoria implica autorizacao do consumidor ao vendedor para obter a restituição de quaisquer tributos incidentes nesta operacao. Valor Aproximado dos Tributos : R$ 573,68"
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

  const Barcode = ({ code }: { code: string }) => {
    const binary = generateBarcode128C(code);
    if (!binary) return <div className="h-10 w-full bg-gray-100 flex items-center justify-center text-[6px]">Erro ao gerar código</div>;

    return (
      <svg className="w-full h-10" viewBox={`0 0 ${binary.length} 40`} preserveAspectRatio="none">
        {binary.split('').map((bit, i) => (
          bit === '1' ? <rect key={i} x={i} y="0" width="1" height="40" fill="black" /> : null
        ))}
      </svg>
    );
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
            A consulta de DANFE requer a chave de acesso de 44 dígitos presente no documento original.
          </p>
        </form>
      </div>

      <div className="max-w-5xl mx-auto print:max-w-none print:m-0">
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
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 print:m-0">
            <div className="flex justify-between items-center mb-6 print:hidden px-4">
              <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                <FileText className="h-5 w-5" />
                DANFE Gerado
              </h3>
              <Button onClick={handlePrint} className="gap-2 font-bold bg-primary hover:bg-primary/90">
                <Printer className="h-4 w-4" />
                Imprimir / Salvar PDF
              </Button>
            </div>

            <div className="bg-white text-black p-2 md:p-4 border shadow-sm rounded-xl print:shadow-none print:border-none print:p-0 print:rounded-none overflow-x-auto print:overflow-visible">
              <div className="min-w-[800px] print:min-w-0 print:w-full border border-black p-1 font-sans text-[8.5px] print:text-[8px]">
                
                <div className="border border-black mb-1 p-1">
                  <div className="grid grid-cols-12 gap-1 border-b border-black pb-1 mb-1">
                    <div className="col-span-10 border-r border-black pr-2">
                      <span className="font-bold uppercase block text-[8px]">Recebemos de {danfeData.emitente.nome} os produtos e/ou serviços constantes da nota fiscal eletrônica indicada ao lado</span>
                      <div className="grid grid-cols-2 mt-4">
                        <div className="border-t border-black pt-1"><span className="uppercase text-[7.5px]">DATA DE RECEBIMENTO</span></div>
                        <div className="border-t border-black border-l border-black pl-2 pt-1 ml-2"><span className="uppercase text-[7.5px]">IDENTIFICAÇÃO E ASSINATURA DO RECEBEDOR</span></div>
                      </div>
                    </div>
                    <div className="col-span-2 flex flex-col items-center justify-center text-center">
                      <h2 className="text-[11px] font-black">NF-e</h2>
                      <p className="font-bold">Nº {danfeData.numero}</p>
                      <p className="font-bold text-[8px]">Série {danfeData.serie}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-12 border border-black mb-1">
                  <div className="col-span-4 p-2 flex flex-col items-center justify-center border-r border-black">
                    <span className="text-[7.5px] font-bold self-start uppercase">Identificação do Emitente</span>
                    <div className="text-center py-2">
                      <h1 className="text-[14px] font-black uppercase leading-tight">{danfeData.emitente.nome}</h1>
                      <p className="text-[8px]">{danfeData.emitente.endereco}</p>
                      <p className="text-[8px]">{danfeData.emitente.bairro} - {danfeData.emitente.cep}</p>
                      <p className="text-[8.5px] font-bold">{danfeData.emitente.cidade} - Fone: {danfeData.emitente.fone}</p>
                    </div>
                  </div>
                  <div className="col-span-3 p-2 border-r border-black flex flex-col items-center justify-center text-center">
                    <h2 className="text-[16px] font-black">DANFE</h2>
                    <p className="text-[8px] font-bold leading-tight">Documento Auxiliar da Nota Fiscal Eletrônica</p>
                    <div className="flex gap-4 mt-2 border border-black p-1 px-4">
                      <div><span className="block text-[7.5px]">0-ENTRADA</span><span className="block text-[7.5px]">1-SAÍDA</span></div>
                      <span className="text-[16px] font-bold">1</span>
                    </div>
                    <div className="mt-2">
                      <p className="font-bold text-[10px]">Nº {danfeData.numero}</p>
                      <p className="font-bold text-[10px]">SÉRIE {danfeData.serie}</p>
                      <p className="text-[8px]">Folha {danfeData.folha}</p>
                    </div>
                  </div>
                  <div className="col-span-5 p-2 flex flex-col justify-between">
                    <div className="w-full bg-white h-12 mb-1 flex items-center justify-center overflow-hidden">
                      <Barcode code={danfeData.chaveAcesso} />
                    </div>
                    <div>
                      <span className="text-[7.5px] font-bold uppercase block">Chave de Acesso</span>
                      <p className="text-[9px] font-mono tracking-tighter text-center border border-black p-1 bg-gray-50">{danfeData.chaveAcesso.match(/.{1,4}/g)?.join(' ')}</p>
                      <p className="text-[8px] text-center mt-1">Consulta de autenticidade no portal nacional da NF-e<br/><span className="underline">www.nfe.fazenda.gov.br/portal</span> ou no site da Sefaz Autorizadora</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-12 border border-black mb-1">
                  <div className="col-span-7 p-1 border-r border-black">
                    <span className="block text-[7.5px]">NATUREZA DA OPERAÇÃO</span>
                    <span className="font-bold text-[9px] uppercase">{danfeData.naturezaOperacao}</span>
                  </div>
                  <div className="col-span-5 p-1">
                    <span className="block text-[7.5px]">PROTOCOLO DE AUTORIZAÇÃO DE USO</span>
                    <span className="font-bold text-[9px]">{danfeData.protocoloAutorizacao}</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 border border-black mb-1">
                  <div className="p-1 border-r border-black">
                    <span className="block text-[7.5px]">INSCRIÇÃO ESTADUAL</span>
                    <span className="font-bold text-[9px]">{danfeData.inscricaoEstadual}</span>
                  </div>
                  <div className="p-1 border-r border-black">
                    <span className="block text-[7.5px]">INSCRIÇÃO ESTADUAL DO SUBST. TRIB.</span>
                    <span className="font-bold text-[9px]">-</span>
                  </div>
                  <div className="p-1 border-r border-black">
                    <span className="block text-[7.5px]">INSCRIÇÃO MUNICIPAL</span>
                    <span className="font-bold text-[9px]">{danfeData.inscricaoMunicipal}</span>
                  </div>
                  <div className="p-1">
                    <span className="block text-[7.5px]">CNPJ</span>
                    <span className="font-bold text-[9px]">{danfeData.emitente.cnpj}</span>
                  </div>
                </div>

                <h4 className="font-bold text-[8.5px] uppercase mt-1">Destinatário / Remetente</h4>
                <div className="border border-black mb-1">
                  <div className="grid grid-cols-12 border-b border-black">
                    <div className="col-span-8 p-1 border-r border-black">
                      <span className="block text-[7.5px]">NOME / RAZÃO SOCIAL</span>
                      <span className="font-bold text-[10px] uppercase">{danfeData.destinatario.nome}</span>
                    </div>
                    <div className="col-span-2 p-1 border-r border-black">
                      <span className="block text-[7.5px]">CNPJ / CPF</span>
                      <span className="font-bold text-[9.5px]">{danfeData.destinatario.cnpjCpf}</span>
                    </div>
                    <div className="col-span-2 p-1">
                      <span className="block text-[7.5px]">DATA DA EMISSÃO</span>
                      <span className="font-bold text-[9.5px]">{danfeData.dataEmissao}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-12 border-b border-black">
                    <div className="col-span-6 p-1 border-r border-black">
                      <span className="block text-[7.5px]">ENDEREÇO</span>
                      <span className="font-bold text-[9.5px] uppercase">{danfeData.destinatario.endereco}</span>
                    </div>
                    <div className="col-span-3 p-1 border-r border-black">
                      <span className="block text-[7.5px]">BAIRRO / DISTRITO</span>
                      <span className="font-bold text-[9.5px] uppercase">{danfeData.destinatario.bairro}</span>
                    </div>
                    <div className="col-span-2 p-1 border-r border-black">
                      <span className="block text-[7.5px]">CEP</span>
                      <span className="font-bold text-[9.5px]">{danfeData.destinatario.cep}</span>
                    </div>
                    <div className="col-span-1 p-1">
                      <span className="block text-[7.5px]">DATA SAÍDA</span>
                      <span className="font-bold text-[9.5px]">{danfeData.dataEmissao}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-12">
                    <div className="col-span-5 p-1 border-r border-black">
                      <span className="block text-[7.5px]">MUNICÍPIO</span>
                      <span className="font-bold text-[9.5px] uppercase">{danfeData.destinatario.cidade}</span>
                    </div>
                    <div className="col-span-1 p-1 border-r border-black">
                      <span className="block text-[7.5px]">UF</span>
                      <span className="font-bold text-[9.5px] uppercase">{danfeData.destinatario.uf}</span>
                    </div>
                    <div className="col-span-2 p-1 border-r border-black">
                      <span className="block text-[7.5px]">FONE / FAX</span>
                      <span className="font-bold text-[9.5px]">{danfeData.destinatario.fone}</span>
                    </div>
                    <div className="col-span-3 p-1 border-r border-black">
                      <span className="block text-[7.5px]">INSCRIÇÃO ESTADUAL</span>
                      <span className="font-bold text-[9.5px] uppercase">{danfeData.destinatario.ie}</span>
                    </div>
                    <div className="col-span-1 p-1">
                      <span className="block text-[7.5px]">HORA SAÍDA</span>
                      <span className="font-bold text-[9.5px]">00:00:00</span>
                    </div>
                  </div>
                </div>

                <h4 className="font-bold text-[8.5px] uppercase mt-1">Cálculo do Imposto</h4>
                <div className="border border-black mb-1">
                  <div className="grid grid-cols-10 border-b border-black">
                    <div className="p-1 border-r border-black"><span className="block text-[7px] truncate">BASE CÁLC. ICMS</span><span className="block text-[9px] text-right font-bold">{danfeData.impostos.bcIcms}</span></div>
                    <div className="p-1 border-r border-black"><span className="block text-[7px] truncate">VALOR DO ICMS</span><span className="block text-[9px] text-right font-bold">{danfeData.impostos.vIcms}</span></div>
                    <div className="p-1 border-r border-black"><span className="block text-[7px] truncate">B. CÁLC. ICMS ST</span><span className="block text-[9px] text-right font-bold">{danfeData.impostos.bcIcmsSt}</span></div>
                    <div className="p-1 border-r border-black"><span className="block text-[7px] truncate">VALOR ICMS ST</span><span className="block text-[9px] text-right font-bold">{danfeData.impostos.vIcmsSt}</span></div>
                    <div className="p-1 border-r border-black"><span className="block text-[7px] truncate">V. IMP. IMPORT.</span><span className="block text-[9px] text-right font-bold">0,00</span></div>
                    <div className="p-1 border-r border-black"><span className="block text-[7px] truncate">V. ICMS UF REMET.</span><span className="block text-[9px] text-right font-bold">0,00</span></div>
                    <div className="p-1 border-r border-black"><span className="block text-[7px] truncate">V. FCP UF DEST.</span><span className="block text-[9px] text-right font-bold">0,00</span></div>
                    <div className="p-1 border-r border-black"><span className="block text-[7px] truncate">V. PIS</span><span className="block text-[9px] text-right font-bold">0,00</span></div>
                    <div className="p-1 border-r border-black"><span className="block text-[7px] truncate">V. COFINS</span><span className="block text-[9px] text-right font-bold">0,00</span></div>
                    <div className="p-1"><span className="block text-[7px] truncate">V. TOTAL PROD.</span><span className="block text-[9px] text-right font-bold">{danfeData.impostos.vProd}</span></div>
                  </div>
                  <div className="grid grid-cols-10">
                    <div className="p-1 border-r border-black"><span className="block text-[7px] truncate">VALOR DO FRETE</span><span className="block text-[9px] text-right font-bold">{danfeData.impostos.vFrete}</span></div>
                    <div className="p-1 border-r border-black"><span className="block text-[7px] truncate">VALOR DO SEGURO</span><span className="block text-[9px] text-right font-bold">{danfeData.impostos.vSeguro}</span></div>
                    <div className="p-1 border-r border-black"><span className="block text-[7px] truncate">DESCONTO</span><span className="block text-[9px] text-right font-bold">{danfeData.impostos.vDesc}</span></div>
                    <div className="p-1 border-r border-black"><span className="block text-[7px] truncate">OUTRAS DESP.</span><span className="block text-[9px] text-right font-bold">{danfeData.impostos.vOutros}</span></div>
                    <div className="p-1 border-r border-black"><span className="block text-[7px] truncate">VALOR DO IPI</span><span className="block text-[9px] text-right font-bold">{danfeData.impostos.vIpi}</span></div>
                    <div className="p-1 border-r border-black"><span className="block text-[7px] truncate">V. ICMS UF DEST.</span><span className="block text-[9px] text-right font-bold">0,00</span></div>
                    <div className="p-1 border-r border-black"><span className="block text-[7px] truncate">V. TOT. TRIB.</span><span className="block text-[9px] text-right font-bold">{danfeData.impostos.vTotTrib}</span></div>
                    <div className="col-span-3 p-1"><span className="block text-[7.5px] truncate">VALOR TOTAL DA NOTA</span><span className="block text-[13px] text-right font-black">R$ {danfeData.impostos.vNota}</span></div>
                  </div>
                </div>

                <h4 className="font-bold text-[8.5px] uppercase mt-1">Transportador / Volumes Transportados</h4>
                <div className="border border-black mb-1">
                  <div className="grid grid-cols-12 border-b border-black">
                    <div className="col-span-6 p-1 border-r border-black">
                      <span className="block text-[7.5px]">RAZÃO SOCIAL</span>
                      <span className="font-bold text-[9.5px] uppercase">{danfeData.transportador.razaoSocial}</span>
                    </div>
                    <div className="col-span-2 p-1 border-r border-black">
                      <span className="block text-[7.5px]">FRETE POR CONTA</span>
                      <span className="font-bold text-[9.5px]">{danfeData.transportador.fretePorConta}</span>
                    </div>
                    <div className="col-span-1 p-1 border-r border-black">
                      <span className="block text-[7.5px]">CÓDIGO ANTT</span>
                      <span className="font-bold text-[9.5px]">-</span>
                    </div>
                    <div className="col-span-1 p-1 border-r border-black">
                      <span className="block text-[7.5px]">PLACA</span>
                      <span className="font-bold text-[9.5px]">{danfeData.transportador.placa}</span>
                    </div>
                    <div className="col-span-1 p-1 border-r border-black">
                      <span className="block text-[7.5px]">UF</span>
                      <span className="font-bold text-[9.5px]">{danfeData.transportador.ufVeiculo}</span>
                    </div>
                    <div className="col-span-1 p-1">
                      <span className="block text-[7.5px]">CNPJ / CPF</span>
                      <span className="font-bold text-[9.5px]">{danfeData.transportador.cnpjCpf}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-12">
                    <div className="col-span-6 p-1 border-r border-black">
                      <span className="block text-[7.5px]">ENDEREÇO</span>
                      <span className="font-bold text-[9.5px] uppercase">{danfeData.transportador.endereco}</span>
                    </div>
                    <div className="col-span-3 p-1 border-r border-black">
                      <span className="block text-[7.5px]">MUNICÍPIO</span>
                      <span className="font-bold text-[9.5px] uppercase">{danfeData.transportador.municipio}</span>
                    </div>
                    <div className="col-span-1 p-1 border-r border-black">
                      <span className="block text-[7.5px]">UF</span>
                      <span className="font-bold text-[9.5px] uppercase">{danfeData.transportador.uf}</span>
                    </div>
                    <div className="col-span-2 p-1">
                      <span className="block text-[7.5px]">INSCRIÇÃO ESTADUAL</span>
                      <span className="font-bold text-[9.5px]">{danfeData.transportador.ie}</span>
                    </div>
                  </div>
                </div>

                <h4 className="font-bold text-[8.5px] uppercase mt-1">Dados dos Produtos / Serviços</h4>
                <div className="border border-black mb-1 min-h-[140px]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-black bg-gray-50 font-bold text-[7px]">
                        <th className="border-r border-black p-1 w-[6%]">CÓD. PROD.</th>
                        <th className="border-r border-black p-1 w-[28%]">DESCRIÇÃO DO PRODUTO / SERVIÇO</th>
                        <th className="border-r border-black p-1">NCM/SH</th>
                        <th className="border-r border-black p-1">CST</th>
                        <th className="border-r border-black p-1">CFOP</th>
                        <th className="border-r border-black p-1">UN.</th>
                        <th className="border-r border-black p-1">QUANT.</th>
                        <th className="border-r border-black p-1">V. UNIT.</th>
                        <th className="border-r border-black p-1">V. TOTAL</th>
                        <th className="border-r border-black p-1">BC ICMS</th>
                        <th className="border-r border-black p-1">V. ICMS</th>
                        <th className="border-r border-black p-1">V. IPI</th>
                        <th className="border-r border-black p-1">AL. ICMS</th>
                        <th className="p-1">AL. IPI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {danfeData.itens.map((item: any, i: number) => (
                        <tr key={i} className="text-[7.5px] border-b border-gray-200">
                          <td className="border-r border-black p-1">{item.cod}</td>
                          <td className="border-r border-black p-1 uppercase truncate max-w-[200px]">{item.desc}</td>
                          <td className="border-r border-black p-1">{item.ncm}</td>
                          <td className="border-r border-black p-1">{item.cst}</td>
                          <td className="border-r border-black p-1">{item.cfop}</td>
                          <td className="border-r border-black p-1">{item.un}</td>
                          <td className="border-r border-black p-1 text-right">{item.qtd}</td>
                          <td className="border-r border-black p-1 text-right">{item.vUnit}</td>
                          <td className="border-r border-black p-1 text-right">{item.vTotal}</td>
                          <td className="border-r border-black p-1 text-right">{item.bcIcms}</td>
                          <td className="border-r border-black p-1 text-right">{item.vIcms}</td>
                          <td className="border-r border-black p-1 text-right">{item.vIpi}</td>
                          <td className="border-r border-black p-1 text-right">{item.aliqIcms}</td>
                          <td className="p-1 text-right">{item.aliqIpi}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-12 border border-black min-h-[70px]">
                  <div className="col-span-8 p-1 border-r border-black">
                    <span className="block text-[7.5px] font-bold">DADOS ADICIONAIS</span>
                    <span className="block text-[7px] font-bold mt-1">INFORMAÇÕES COMPLEMENTARES</span>
                    <p className="text-[7px] leading-tight text-justify mt-1">
                      {danfeData.infoComplementar}
                    </p>
                  </div>
                  <div className="col-span-4 p-1">
                    <span className="block text-[7.5px] font-bold uppercase">Reservado ao Fisco</span>
                  </div>
                </div>

                <div className="text-[6px] text-center mt-2 italic text-gray-500 print:block hidden">
                  Este é um Documento Auxiliar da Nota Fiscal Eletrônica (DANFE) gerado eletronicamente via Consulta Pro em {new Date().toLocaleString('pt-BR')}.
                </div>

              </div>
            </div>
          </div>
        )}

        {!danfeData && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground bg-accent/5 rounded-3xl border print:hidden">
            <ScanBarcode className="h-16 w-16 mb-4 opacity-20" />
            <p className="font-medium text-lg">Aguardando Chave de Acesso</p>
            <p className="text-sm">Insira os 44 dígitos da nota para visualizar o DANFE.</p>
          </div>
        )}
      </div>
    </div>
  );
}
