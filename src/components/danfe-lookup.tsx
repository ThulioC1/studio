
"use client"

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Search, Loader2, FileText, Printer, ScanBarcode, AlertCircle, Code, FileSearch, Info } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { generateBarcode128C } from '@/lib/barcode-utils';
import { fetchCompanyData } from '@/services/cnpj-service';
import { generateDanfeFromXml } from '@/services/danfe-service';
import { formatCnpj, formatPhone } from '@/types/cnpj';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function DanfeLookup() {
  const [chave, setChave] = useState('');
  const [xmlContent, setXmlContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [danfeData, setDanfeData] = useState<any | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const handleSearchByKey = async () => {
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
    setPdfBase64(null);

    try {
      const issuerCnpj = cleaned.substring(6, 20);
      let issuerInfo = null;

      try {
        issuerInfo = await fetchCompanyData(issuerCnpj);
      } catch (e) {
        console.warn("Não foi possível buscar os dados reais do emitente.");
      }
      
      const seed = parseInt(cleaned.substring(30, 34)) || 1234;
      const valBaseNum = (seed / 10);
      const valBase = valBaseNum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      
      const mockData = {
        chaveAcesso: cleaned,
        numero: cleaned.substring(25, 34).replace(/^0+/, '') || "123.456",
        serie: cleaned.substring(22, 25).replace(/^0+/, '') || "001",
        folha: "1/1",
        dataEmissao: new Date().toLocaleDateString('pt-BR'),
        naturezaOperacao: seed % 2 === 0 ? "Venda de Mercadoria" : "Remessa para Industrialização",
        protocoloAutorizacao: `1${cleaned.substring(0, 14)} - ${new Date().toLocaleString('pt-BR')}`,
        inscricaoEstadual: issuerInfo?.cnpj ? cleaned.substring(10, 19) : "ISENTO",
        inscricaoMunicipal: cleaned.substring(34, 39),
        emitente: {
          nome: issuerInfo?.razao_social || "EMITENTE SIMULADO LTDA",
          cnpj: formatCnpj(issuerCnpj),
          endereco: issuerInfo ? `${issuerInfo.logradouro}, ${issuerInfo.numero} ${issuerInfo.complemento || ''}` : "AVENIDA INDUSTRIAL, " + seed,
          bairro: issuerInfo?.bairro || "DISTRITO INDUSTRIAL",
          cidade: issuerInfo ? `${issuerInfo.municipio} - ${issuerInfo.uf}` : "São Paulo - SP",
          cep: issuerInfo?.cep || "01000-000",
          fone: issuerInfo ? formatPhone(undefined, issuerInfo.ddd_telefone_1) : "(11) 4004-0000"
        },
        destinatario: {
          nome: user?.displayName || "CLIENTE CONSUMIDOR FINAL",
          cnpjCpf: "00.000.000/0001-00",
          endereco: "RUA DAS FLORES, 100",
          bairro: "CENTRO",
          cep: "58000-000",
          cidade: "João Pessoa",
          uf: "PB",
          fone: "(83) 9999-9999",
          ie: "ISENTO"
        },
        impostos: {
          bcIcms: valBase,
          vIcms: (valBaseNum * 0.12).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          bcIcmsSt: "0,00",
          vIcmsSt: "0,00",
          vProd: (valBaseNum * 0.9).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          vFrete: "0,00",
          vSeguro: "0,00",
          vDesc: "0,00",
          vOutros: "0,00",
          vIpi: "0,00",
          vTotTrib: (valBaseNum * 0.31).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          vNota: valBase
        },
        transportador: {
          razaoSocial: "TRANSPORTES RAPIDO LTDA",
          fretePorConta: "0-Por conta do Rem",
          cnpjCpf: "11.222.333/0001-44",
          placa: "ABC-0000",
          ufVeiculo: "SP",
          ie: "123456789",
          endereco: "VIA ANHANGUERA KM 10",
          municipio: "SAO PAULO",
          uf: "SP"
        },
        volumes: {
          quantidade: "1",
          especie: "VOLUME",
          pesoBruto: "1,500",
          pesoLiquido: "1,450"
        },
        itens: [
          { 
            cod: cleaned.substring(40, 44), 
            desc: "PRODUTO REFERENTE A CHAVE " + cleaned.substring(0, 4), 
            ncm: "85171231", 
            cst: "000", 
            cfop: "5102", 
            un: "UN", 
            qtd: "1,0000", 
            vUnit: valBase, 
            vTotal: valBase, 
            bcIcms: valBase, 
            vIcms: (valBaseNum * 0.12).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 
            vIpi: "0,00", 
            aliqIcms: "12,00", 
            aliqIpi: "0,00" 
          }
        ],
        infoComplementar: "Atenção: Esta é uma pré-visualização baseada no Emitente Real. Para obter o documento com itens e impostos 100% autênticos, utilize a aba 'Por XML'."
      };

      setDanfeData(mockData);
      
      if (user) {
        addDoc(collection(db, 'user_profiles', user.uid, 'danfe_history'), {
          chaveAcesso: cleaned,
          timestamp: serverTimestamp()
        }).catch(() => {});
      }
    } catch (err: any) {
      setError("Erro ao processar chave.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFromXml = async () => {
    if (!xmlContent.trim()) {
      toast({
        variant: "destructive",
        title: "XML vazio",
        description: "Cole o conteúdo XML da nota para gerar o DANFE real."
      });
      return;
    }

    setLoading(true);
    setError(null);
    setDanfeData(null);
    setPdfBase64(null);

    try {
      const base64 = await generateDanfeFromXml(xmlContent);
      setPdfBase64(base64);
      toast({
        title: "DANFE Gerado!",
        description: "O documento real foi processado com sucesso."
      });
    } catch (err: any) {
      setError(err.message || "Erro ao conectar com a API de geração.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (pdfBase64) {
      const byteCharacters = atob(pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {type: 'application/pdf'});
      const url = URL.createObjectURL(blob);
      window.open(url);
    } else {
      window.print();
    }
  };

  const Barcode = ({ code }: { code: string }) => {
    const binary = generateBarcode128C(code);
    if (!binary) return null;
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
      <div className="flex flex-col items-center mb-6 print:hidden">
        <Tabs defaultValue="xml" className="w-full max-w-2xl">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="xml" className="gap-2">
              <Code className="h-4 w-4" />
              Por XML (Dados Reais)
            </TabsTrigger>
            <TabsTrigger value="key" className="gap-2">
              <FileSearch className="h-4 w-4" />
              Por Chave (Híbrido)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="xml">
            <div className="space-y-4">
              <Alert className="bg-primary/5 border-primary/20">
                <Info className="h-4 w-4 text-primary" />
                <AlertTitle>Recomendado para Documentos Oficiais</AlertTitle>
                <AlertDescription className="text-xs">
                  A geração via XML é a única que garante 100% de fidelidade nos itens e impostos, conforme o arquivo assinado digitalmente.
                </AlertDescription>
              </Alert>
              <Textarea 
                placeholder="Cole o conteúdo XML completo aqui..." 
                className="min-h-[150px] font-mono text-xs shadow-lg rounded-2xl p-4 bg-card"
                value={xmlContent}
                onChange={(e) => setXmlContent(e.target.value)}
              />
              <Button 
                onClick={handleGenerateFromXml} 
                className="w-full h-12 rounded-xl font-bold gap-2 text-lg"
                disabled={loading || !xmlContent}
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
                Gerar DANFE 100% Real
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="key">
            <div className="space-y-4">
              <form onSubmit={(e) => { e.preventDefault(); handleSearchByKey(); }} className="relative group">
                <Input
                  placeholder="Digite a Chave de Acesso (44 dígitos)..."
                  value={chave}
                  onChange={(e) => setChave(e.target.value.replace(/\D/g, '').slice(0, 44))}
                  className="h-16 pl-14 pr-32 text-lg rounded-2xl shadow-lg border-2 border-transparent focus-visible:border-accent transition-all bg-card"
                />
                <ScanBarcode className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Button type="submit" size="lg" disabled={loading || chave.length < 44} className="h-10 px-6 rounded-xl font-bold">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Consultar'}
                  </Button>
                </div>
              </form>
              <p className="text-[10px] text-muted-foreground text-center">
                * A busca por chave identifica o emitente real, mas itens e impostos são simulados devido a restrições de privacidade da SEFAZ.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="max-w-5xl mx-auto print:max-w-none print:m-0">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4 bg-card rounded-2xl border border-dashed print:hidden">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground font-medium">Processando documento fiscal...</p>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="print:hidden">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {pdfBase64 && (
          <div className="bg-card p-8 rounded-2xl border shadow-lg text-center space-y-6">
            <div className="flex justify-center">
              <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
                <FileText className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold">DANFE Real Gerado!</h3>
            <p className="text-muted-foreground">O documento oficial foi gerado a partir do seu XML e está pronto para impressão.</p>
            <Button onClick={handlePrint} size="lg" className="w-full max-w-sm gap-2 text-lg h-14">
              <Printer className="h-6 w-6" />
              Visualizar / Imprimir PDF
            </Button>
          </div>
        )}

        {danfeData && !pdfBase64 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 print:m-0">
            <div className="flex justify-between items-center mb-6 print:hidden px-4">
              <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Pré-visualização do DANFE
              </h3>
              <Button onClick={handlePrint} className="gap-2 font-bold bg-primary hover:bg-primary/90">
                <Printer className="h-4 w-4" />
                Imprimir / Salvar PDF
              </Button>
            </div>

            <div className="bg-white text-black p-2 md:p-4 border shadow-sm rounded-xl print:shadow-none print:border-none print:p-0 print:rounded-none overflow-x-auto print:overflow-visible">
              <div className="min-w-[780px] print:min-w-0 print:w-full border border-black p-1 font-sans text-[9px] print:text-[8px] leading-tight">
                
                {/* Cabeçalho Recebemos */}
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
                      <h2 className="text-[12px] font-black">NF-e</h2>
                      <p className="font-bold">Nº {danfeData.numero}</p>
                      <p className="font-bold text-[8.5px]">Série {danfeData.serie}</p>
                    </div>
                  </div>
                </div>

                {/* Identificação do Emitente */}
                <div className="grid grid-cols-12 border border-black mb-1">
                  <div className="col-span-4 p-2 flex flex-col items-center justify-center border-r border-black">
                    <span className="text-[8px] font-bold self-start uppercase">Identificação do Emitente</span>
                    <div className="text-center py-2 w-full">
                      <h1 className="text-[15px] font-black uppercase leading-tight mb-1">{danfeData.emitente.nome}</h1>
                      <p className="text-[10px] uppercase">{danfeData.emitente.endereco}</p>
                      <p className="text-[10px] uppercase">{danfeData.emitente.bairro} - {danfeData.emitente.cep}</p>
                      <p className="text-[10.5px] font-bold uppercase">{danfeData.emitente.cidade} - Fone: {danfeData.emitente.fone}</p>
                    </div>
                  </div>
                  <div className="col-span-3 p-2 border-r border-black flex flex-col items-center justify-center text-center">
                    <h2 className="text-[18px] font-black">DANFE</h2>
                    <p className="text-[9px] font-bold leading-tight">Documento Auxiliar da Nota Fiscal Eletrônica</p>
                    <div className="flex gap-4 mt-2 border border-black p-1 px-4">
                      <div><span className="block text-[8px]">0-ENTRADA</span><span className="block text-[8px]">1-SAÍDA</span></div>
                      <span className="text-[18px] font-bold">1</span>
                    </div>
                    <div className="mt-2">
                      <p className="font-bold text-[12px]">Nº {danfeData.numero}</p>
                      <p className="font-bold text-[12px]">SÉRIE {danfeData.serie}</p>
                      <p className="text-[10px]">Folha {danfeData.folha}</p>
                    </div>
                  </div>
                  <div className="col-span-5 p-2 flex flex-col justify-between">
                    <div className="w-full bg-white h-12 mb-1 flex items-center justify-center overflow-hidden">
                      <Barcode code={danfeData.chaveAcesso} />
                    </div>
                    <div>
                      <span className="text-[8px] font-bold uppercase block">Chave de Acesso</span>
                      <p className="text-[11px] font-mono tracking-tighter text-center border border-black p-1 bg-gray-50">{danfeData.chaveAcesso.match(/.{1,4}/g)?.join(' ')}</p>
                      <p className="text-[8.5px] text-center mt-1 leading-none">Consulta de autenticidade no portal nacional da NF-e<br/>www.nfe.fazenda.gov.br/portal ou no site da Sefaz Autorizadora</p>
                    </div>
                  </div>
                </div>

                {/* Natureza da Operação */}
                <div className="grid grid-cols-12 border border-black mb-1">
                  <div className="col-span-7 p-1 border-r border-black">
                    <span className="block text-[8px]">NATUREZA DA OPERAÇÃO</span>
                    <span className="font-bold text-[11px] uppercase">{danfeData.naturezaOperacao}</span>
                  </div>
                  <div className="col-span-5 p-1">
                    <span className="block text-[8px]">PROTOCOLO DE AUTORIZAÇÃO DE USO</span>
                    <span className="font-bold text-[11px]">{danfeData.protocoloAutorizacao}</span>
                  </div>
                </div>

                {/* Inscrições */}
                <div className="grid grid-cols-4 border border-black mb-1">
                  <div className="p-1 border-r border-black">
                    <span className="block text-[8px]">INSCRIÇÃO ESTADUAL</span>
                    <span className="font-bold text-[11px]">{danfeData.inscricaoEstadual}</span>
                  </div>
                  <div className="p-1 border-r border-black">
                    <span className="block text-[8px]">INSCRIÇÃO ESTADUAL DO SUBST. TRIB.</span>
                    <span className="font-bold text-[11px]">-</span>
                  </div>
                  <div className="p-1 border-r border-black">
                    <span className="block text-[8px]">INSCRIÇÃO MUNICIPAL</span>
                    <span className="font-bold text-[11px]">{danfeData.inscricaoMunicipal}</span>
                  </div>
                  <div className="p-1">
                    <span className="block text-[8px]">CNPJ</span>
                    <span className="font-bold text-[11px]">{danfeData.emitente.cnpj}</span>
                  </div>
                </div>

                <h4 className="font-bold text-[10px] uppercase mt-1 mb-0.5">Destinatário / Remetente</h4>
                <div className="border border-black mb-1">
                  <div className="grid grid-cols-12 border-b border-black">
                    <div className="col-span-8 p-1 border-r border-black">
                      <span className="block text-[8px]">NOME / RAZÃO SOCIAL</span>
                      <span className="font-bold text-[12px] uppercase">{danfeData.destinatario.nome}</span>
                    </div>
                    <div className="col-span-2 p-1 border-r border-black">
                      <span className="block text-[8px]">CNPJ / CPF</span>
                      <span className="font-bold text-[11px]">{danfeData.destinatario.cnpjCpf}</span>
                    </div>
                    <div className="col-span-2 p-1">
                      <span className="block text-[8px]">DATA DA EMISSÃO</span>
                      <span className="font-bold text-[11px]">{danfeData.dataEmissao}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-12 border-b border-black">
                    <div className="col-span-6 p-1 border-r border-black">
                      <span className="block text-[8px]">ENDEREÇO</span>
                      <span className="font-bold text-[11px] uppercase">{danfeData.destinatario.endereco}</span>
                    </div>
                    <div className="col-span-3 p-1 border-r border-black">
                      <span className="block text-[8px]">BAIRRO / DISTRITO</span>
                      <span className="font-bold text-[11px] uppercase">{danfeData.destinatario.bairro}</span>
                    </div>
                    <div className="col-span-2 p-1 border-r border-black">
                      <span className="block text-[8px]">CEP</span>
                      <span className="font-bold text-[11px]">{danfeData.destinatario.cep}</span>
                    </div>
                    <div className="col-span-1 p-1">
                      <span className="block text-[8px]">DATA SAÍDA</span>
                      <span className="font-bold text-[11px]">{danfeData.dataEmissao}</span>
                    </div>
                  </div>
                </div>

                <h4 className="font-bold text-[10px] uppercase mt-1 mb-0.5">Cálculo do Imposto</h4>
                <div className="border border-black mb-1">
                  <div className="grid grid-cols-10 border-b border-black">
                    <div className="p-1 border-r border-black"><span className="block text-[8px] truncate">BASE CÁLC. ICMS</span><span className="block text-[11px] text-right font-bold">{danfeData.impostos.bcIcms}</span></div>
                    <div className="p-1 border-r border-black"><span className="block text-[8px] truncate">VALOR DO ICMS</span><span className="block text-[11px] text-right font-bold">{danfeData.impostos.vIcms}</span></div>
                    <div className="p-1 border-r border-black"><span className="block text-[8px] truncate">B. CÁLC. ICMS ST</span><span className="block text-[11px] text-right font-bold">{danfeData.impostos.bcIcmsSt}</span></div>
                    <div className="p-1 border-r border-black"><span className="block text-[8px] truncate">VALOR ICMS ST</span><span className="block text-[11px] text-right font-bold">{danfeData.impostos.vIcmsSt}</span></div>
                    <div className="p-1 border-r border-black"><span className="block text-[8px] truncate">V. TOTAL PROD.</span><span className="block text-[11px] text-right font-bold">{danfeData.impostos.vProd}</span></div>
                    <div className="col-span-5 p-1"><span className="block text-[9px] font-bold truncate">VALOR TOTAL DA NOTA</span><span className="block text-[18px] text-right font-black">R$ {danfeData.impostos.vNota}</span></div>
                  </div>
                </div>

                <h4 className="font-bold text-[10px] uppercase mt-1 mb-0.5">Dados dos Produtos / Serviços</h4>
                <div className="border border-black mb-1 min-h-[160px]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-black bg-gray-50 font-bold text-[8px]">
                        <th className="border-r border-black p-1 w-[10%]">CÓD. PROD.</th>
                        <th className="border-r border-black p-1 w-[40%]">DESCRIÇÃO DO PRODUTO / SERVIÇO</th>
                        <th className="border-r border-black p-1">NCM</th>
                        <th className="border-r border-black p-1 text-right">QTD</th>
                        <th className="border-r border-black p-1 text-right">V. UNIT</th>
                        <th className="p-1 text-right">V. TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {danfeData.itens.map((item: any, i: number) => (
                        <tr key={i} className="text-[10px] border-b border-gray-100">
                          <td className="border-r border-black p-1">{item.cod}</td>
                          <td className="border-r border-black p-1 uppercase">{item.desc}</td>
                          <td className="border-r border-black p-1">{item.ncm}</td>
                          <td className="border-r border-black p-1 text-right">{item.qtd}</td>
                          <td className="border-r border-black p-1 text-right">{item.vUnit}</td>
                          <td className="p-1 text-right font-bold">{item.vTotal}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-12 border border-black min-h-[80px]">
                  <div className="col-span-8 p-1 border-r border-black">
                    <span className="block text-[9px] font-bold">DADOS ADICIONAIS</span>
                    <span className="block text-[8px] font-bold mt-1 uppercase">Informações Complementares</span>
                    <p className="text-[9px] leading-tight text-justify mt-1">
                      {danfeData.infoComplementar}
                    </p>
                  </div>
                  <div className="col-span-4 p-1">
                    <span className="block text-[9px] font-bold uppercase">Reservado ao Fisco</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {!danfeData && !pdfBase64 && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground bg-accent/5 rounded-3xl border border-dashed print:hidden">
            <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center mb-6">
              <ScanBarcode className="h-10 w-10 text-primary/40" />
            </div>
            <p className="font-bold text-xl text-foreground">Pronto para Consultar</p>
            <p className="text-sm max-w-sm text-center mt-2">
              Utilize o XML para gerar o documento completo com dados reais ou a Chave de Acesso para uma consulta híbrida.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
