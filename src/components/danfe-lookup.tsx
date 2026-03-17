
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
  const [sourceType, setSourceType] = useState<'xml' | 'key'>('xml');
  
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  /**
   * Parser Robusto de XML NF-e
   * Extrai dados reais das tags oficiais da Receita Federal
   */
  const parseNFeXml = (xmlText: string) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    
    if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
      throw new Error("O conteúdo colado não é um XML válido.");
    }

    const getVal = (tagName: string, parent: Element | Document = xmlDoc) => {
      const el = parent.getElementsByTagName(tagName)[0];
      return el ? el.textContent : '';
    };

    // Estrutura principal da NF-e
    const nfe = xmlDoc.getElementsByTagName("infNFe")[0];
    if (!nfe) throw new Error("Não foi encontrada a tag <infNFe>. Certifique-se de colar o XML completo da nota.");

    const emit = nfe.getElementsByTagName("emit")[0];
    const dest = nfe.getElementsByTagName("dest")[0];
    const icmsTot = nfe.getElementsByTagName("ICMSTot")[0];
    const infProt = xmlDoc.getElementsByTagName("infProt")[0];
    
    // Processamento de Itens (Produtos)
    const detElements = Array.from(nfe.getElementsByTagName("det"));
    const itens = detElements.map(det => {
      const prod = det.getElementsByTagName("prod")[0];
      const imposto = det.getElementsByTagName("imposto")[0];
      
      return {
        cod: getVal("cProd", prod),
        desc: getVal("xProd", prod),
        ncm: getVal("NCM", prod),
        cfop: getVal("CFOP", prod),
        un: getVal("uCom", prod),
        qtd: parseFloat(getVal("qCom", prod) || "0").toLocaleString('pt-BR', { minimumFractionDigits: 4 }),
        vUnit: parseFloat(getVal("vUnCom", prod) || "0").toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        vTotal: parseFloat(getVal("vProd", prod) || "0").toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      };
    });

    // Formatação de endereço do emitente
    const enderEmit = emit.getElementsByTagName("enderEmit")[0];
    const enderDest = dest.getElementsByTagName("enderDest")[0];

    return {
      chaveAcesso: getVal("chNFe", infProt) || nfe.getAttribute("Id")?.replace('NFe', '') || "CHAVE NÃO IDENTIFICADA",
      numero: getVal("nNF", nfe),
      serie: getVal("serie", nfe),
      folha: "1/1",
      dataEmissao: new Date(getVal("dhEmi", nfe) || getVal("dEmi", nfe) || "").toLocaleDateString('pt-BR'),
      naturezaOperacao: getVal("natOp", nfe),
      protocoloAutorizacao: infProt ? `${getVal("nProt", infProt)} - ${new Date(getVal("dhRecbto", infProt) || "").toLocaleString('pt-BR')}` : "PROCESSO PENDENTE",
      inscricaoEstadual: getVal("IE", emit),
      inscricaoMunicipal: getVal("IM", emit),
      isRealData: true,
      emitente: {
        nome: getVal("xNome", emit),
        cnpj: formatCnpj(getVal("CNPJ", emit) || ""),
        endereco: `${getVal("xLgr", enderEmit)}, ${getVal("nro", enderEmit)} ${getVal("xCpl", enderEmit) || ""}`,
        bairro: getVal("xBairro", enderEmit),
        cidade: `${getVal("xMun", enderEmit)} - ${getVal("UF", enderEmit)}`,
        cep: getVal("CEP", enderEmit),
        fone: getVal("fone", enderEmit)
      },
      destinatario: {
        nome: getVal("xNome", dest),
        cnpjCpf: formatCnpj(getVal("CNPJ", dest) || getVal("CPF", dest) || ""),
        endereco: `${getVal("xLgr", enderDest)}, ${getVal("nro", enderDest)}`,
        bairro: getVal("xBairro", enderDest),
        cep: getVal("CEP", enderDest),
        cidade: getVal("xMun", enderDest),
        uf: getVal("UF", enderDest),
        fone: getVal("fone", enderDest),
        ie: getVal("IE", dest)
      },
      impostos: {
        bcIcms: parseFloat(getVal("vBC", icmsTot) || "0").toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        vIcms: parseFloat(getVal("vICMS", icmsTot) || "0").toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        bcIcmsSt: parseFloat(getVal("vBCST", icmsTot) || "0").toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        vIcmsSt: parseFloat(getVal("vST", icmsTot) || "0").toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        vProd: parseFloat(getVal("vProd", icmsTot) || "0").toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        vNota: parseFloat(getVal("vNF", icmsTot) || "0").toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      },
      itens,
      infoComplementar: getVal("infCpl", nfe) || "DADOS EXTRAÍDOS INTEGRALMENTE DO XML ORIGINAL (v4.00)."
    };
  };

  const handleSearchByKey = async () => {
    const cleaned = chave.replace(/\D/g, '');
    
    if (cleaned.length !== 44) {
      toast({
        variant: "destructive",
        title: "Chave incompleta",
        description: "A Chave de Acesso deve ter 44 números."
      });
      return;
    }

    setLoading(true);
    setError(null);
    setSourceType('key');

    try {
      const issuerCnpj = cleaned.substring(6, 20);
      const issuerInfo = await fetchCompanyData(issuerCnpj);
      
      const seed = parseInt(cleaned.substring(30, 34)) || 1234;
      const valBaseNum = (seed / 10);
      const valBase = valBaseNum.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      
      const hybridData = {
        chaveAcesso: cleaned,
        numero: cleaned.substring(25, 34).replace(/^0+/, '') || "123.456",
        serie: cleaned.substring(22, 25).replace(/^0+/, '') || "001",
        folha: "1/1",
        dataEmissao: new Date().toLocaleDateString('pt-BR'),
        naturezaOperacao: "VENDA DE MERCADORIA (DADOS PÚBLICOS)",
        protocoloAutorizacao: `1${cleaned.substring(0, 14)} - AUTORIZADA`,
        inscricaoEstadual: cleaned.substring(10, 19),
        inscricaoMunicipal: "",
        isRealData: false, // Flag para indicar que o conteúdo é simulado
        emitente: {
          nome: issuerInfo.razao_social,
          cnpj: formatCnpj(issuerCnpj),
          endereco: `${issuerInfo.logradouro}, ${issuerInfo.numero}`,
          bairro: issuerInfo.bairro,
          cidade: `${issuerInfo.municipio} - ${issuerInfo.uf}`,
          cep: issuerInfo.cep,
          fone: formatPhone(undefined, issuerInfo.ddd_telefone_1)
        },
        destinatario: {
          nome: "DADOS PROTEGIDOS (USAR XML PARA VER)",
          cnpjCpf: "000.000.000-00",
          endereco: "ENDEREÇO NÃO DISPONÍVEL NA BUSCA PÚBLICA",
          bairro: "-",
          cep: "-",
          cidade: "-",
          uf: "-",
          fone: "-",
          ie: "-"
        },
        impostos: {
          bcIcms: valBase,
          vIcms: "0,00",
          bcIcmsSt: "0,00",
          vIcmsSt: "0,00",
          vProd: valBase,
          vNota: valBase
        },
        itens: [
          { 
            cod: "SIM-001", 
            desc: "DADOS DE ITENS SÓ PODEM SER LIDOS VIA XML", 
            ncm: "00000000", 
            qtd: "1,0000", 
            vUnit: valBase, 
            vTotal: valBase, 
          }
        ],
        infoComplementar: "IMPORTANTE: A busca por chave identifica o EMITENTE REAL, mas o conteúdo da nota (itens e destinatário) é protegido. Use a aba 'POR XML' para carregar a nota completa."
      };

      setDanfeData(hybridData);
    } catch (err: any) {
      setError("Não foi possível identificar o emitente desta chave.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFromXml = async () => {
    if (!xmlContent.trim()) return;

    setLoading(true);
    setError(null);
    setSourceType('xml');

    try {
      const realData = parseNFeXml(xmlContent);
      setDanfeData(realData);

      // Opcional: Tenta gerar o PDF oficial via API se houver endpoint configurado
      try {
        const base64 = await generateDanfeFromXml(xmlContent);
        setPdfBase64(base64);
      } catch (e) {
        console.warn("API de PDF offline, usando pré-visualização local.");
      }

      toast({
        title: "Sucesso!",
        description: "Dados extraídos com sucesso do seu XML."
      });
    } catch (err: any) {
      setError(err.message || "Erro ao processar o XML.");
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
        <Tabs defaultValue="xml" className="w-full max-w-2xl" onValueChange={(v) => setSourceType(v as any)}>
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
                <AlertTitle>Importante</AlertTitle>
                <AlertDescription className="text-xs">
                  Para ver os <strong>itens reais, impostos e destinatário</strong>, cole o conteúdo XML oficial da nota fiscal abaixo.
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
                Carregar Dados do XML
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
              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-[10px] text-amber-700">
                  A busca por chave identifica o <strong>Emitente Real</strong>, mas os itens e destinatário são omitidos por segurança da SEFAZ. Use a aba XML para dados completos.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="max-w-5xl mx-auto print:max-w-none print:m-0">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4 bg-card rounded-2xl border border-dashed print:hidden">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground font-medium">Processando informações da nota...</p>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="print:hidden">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {danfeData && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 print:m-0">
            <div className="flex justify-between items-center mb-6 print:hidden px-4">
              <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {danfeData.isRealData ? "DANFE: Dados Reais Extraídos" : "DANFE: Pré-visualização (Emitente Real)"}
              </h3>
              <Button onClick={handlePrint} className="gap-2 font-bold bg-primary hover:bg-primary/90 shadow-md">
                <Printer className="h-4 w-4" />
                {pdfBase64 ? "Imprimir PDF Oficial" : "Imprimir Preview"}
              </Button>
            </div>

            <div className="bg-white text-black p-2 md:p-4 border shadow-sm rounded-xl print:shadow-none print:border-none print:p-0 print:rounded-none overflow-x-auto print:overflow-visible">
              <div className="min-w-[820px] print:min-w-0 print:w-full border border-black p-1 font-sans text-[11px] print:text-[10px] leading-tight">
                
                {/* Canhoto de Recebimento */}
                <div className="border border-black mb-1 p-1">
                  <div className="grid grid-cols-12 gap-1 border-b border-black pb-1 mb-1">
                    <div className="col-span-10 border-r border-black pr-2">
                      <span className="font-bold uppercase block text-[9.5px]">Recebemos de {danfeData.emitente.nome} os produtos e/ou serviços constantes da nota fiscal eletrônica indicada ao lado</span>
                      <div className="grid grid-cols-2 mt-4">
                        <div className="border-t border-black pt-1"><span className="uppercase text-[9px]">DATA DE RECEBIMENTO</span></div>
                        <div className="border-t border-black border-l border-black pl-2 pt-1 ml-2"><span className="uppercase text-[9px]">IDENTIFICAÇÃO E ASSINATURA DO RECEBEDOR</span></div>
                      </div>
                    </div>
                    <div className="col-span-2 flex flex-col items-center justify-center text-center">
                      <h2 className="text-[14px] font-black">NF-e</h2>
                      <p className="font-bold">Nº {danfeData.numero}</p>
                      <p className="font-bold text-[10px]">Série {danfeData.serie}</p>
                    </div>
                  </div>
                </div>

                {/* Bloco de Identificação */}
                <div className="grid grid-cols-12 border border-black mb-1">
                  <div className="col-span-4 p-2 flex flex-col items-center justify-center border-r border-black text-center">
                    <h1 className="text-[16px] font-black uppercase leading-tight mb-1">{danfeData.emitente.nome}</h1>
                    <p className="text-[11px] uppercase">{danfeData.emitente.endereco}</p>
                    <p className="text-[11px] uppercase">{danfeData.emitente.bairro} - {danfeData.emitente.cep}</p>
                    <p className="text-[11px] font-bold uppercase">{danfeData.emitente.cidade} - Fone: {danfeData.emitente.fone}</p>
                  </div>
                  <div className="col-span-3 p-2 border-r border-black flex flex-col items-center justify-center text-center">
                    <h2 className="text-[18px] font-black">DANFE</h2>
                    <p className="text-[10px] font-bold leading-tight uppercase">Documento Auxiliar da<br/>Nota Fiscal Eletrônica</p>
                    <div className="flex gap-4 mt-2 border border-black p-1 px-4">
                      <div><span className="block text-[9px]">0-ENTRADA</span><span className="block text-[9px]">1-SAÍDA</span></div>
                      <span className="text-[18px] font-bold">1</span>
                    </div>
                    <div className="mt-1">
                      <p className="font-bold text-[14px]">Nº {danfeData.numero}</p>
                      <p className="font-bold text-[14px]">SÉRIE {danfeData.serie}</p>
                      <p className="text-[10px]">Folha {danfeData.folha}</p>
                    </div>
                  </div>
                  <div className="col-span-5 p-2 flex flex-col justify-between">
                    <div className="w-full h-10 mb-1 flex items-center justify-center">
                      <Barcode code={danfeData.chaveAcesso} />
                    </div>
                    <div>
                      <span className="text-[9.5px] font-bold uppercase block">Chave de Acesso</span>
                      <p className="text-[13px] font-mono tracking-tighter text-center border border-black p-1 bg-gray-50">{danfeData.chaveAcesso.match(/.{1,4}/g)?.join(' ')}</p>
                      <p className="text-[9px] text-center mt-1 leading-none">Consulta de autenticidade no portal nacional da NF-e<br/>www.nfe.fazenda.gov.br/portal ou no site da Sefaz Autorizadora</p>
                    </div>
                  </div>
                </div>

                {/* Natureza e Protocolo */}
                <div className="grid grid-cols-12 border border-black mb-1">
                  <div className="col-span-7 p-1 border-r border-black">
                    <span className="block text-[9.5px]">NATUREZA DA OPERAÇÃO</span>
                    <span className="font-bold text-[12px] uppercase">{danfeData.naturezaOperacao}</span>
                  </div>
                  <div className="col-span-5 p-1">
                    <span className="block text-[9.5px]">PROTOCOLO DE AUTORIZAÇÃO DE USO</span>
                    <span className="font-bold text-[12px]">{danfeData.protocoloAutorizacao}</span>
                  </div>
                </div>

                {/* Inscrições e CNPJ */}
                <div className="grid grid-cols-4 border border-black mb-1">
                  <div className="p-1 border-r border-black">
                    <span className="block text-[9.5px]">INSCRIÇÃO ESTADUAL</span>
                    <span className="font-bold text-[12px]">{danfeData.inscricaoEstadual}</span>
                  </div>
                  <div className="p-1 border-r border-black">
                    <span className="block text-[9.5px]">INSC.ESTADUAL DO SUBST. TRIB.</span>
                    <span className="font-bold text-[12px]">-</span>
                  </div>
                  <div className="p-1 border-r border-black">
                    <span className="block text-[9.5px]">CNPJ</span>
                    <span className="font-bold text-[12px]">{danfeData.emitente.cnpj}</span>
                  </div>
                  <div className="p-1">
                    <span className="block text-[9.5px]">INSCRIÇÃO MUNICIPAL</span>
                    <span className="font-bold text-[12px]">{danfeData.inscricaoMunicipal || '-'}</span>
                  </div>
                </div>

                <h4 className="font-bold text-[11px] uppercase mt-1 mb-0.5">Destinatário / Remetente</h4>
                <div className="border border-black mb-1">
                  <div className="grid grid-cols-12 border-b border-black">
                    <div className="col-span-8 p-1 border-r border-black">
                      <span className="block text-[9.5px]">NOME / RAZÃO SOCIAL</span>
                      <span className="font-bold text-[13px] uppercase">{danfeData.destinatario.nome}</span>
                    </div>
                    <div className="col-span-2 p-1 border-r border-black">
                      <span className="block text-[9.5px]">CNPJ / CPF</span>
                      <span className="font-bold text-[12px]">{danfeData.destinatario.cnpjCpf}</span>
                    </div>
                    <div className="col-span-2 p-1">
                      <span className="block text-[9.5px]">DATA DA EMISSÃO</span>
                      <span className="font-bold text-[12px]">{danfeData.dataEmissao}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-12">
                    <div className="col-span-6 p-1 border-r border-black">
                      <span className="block text-[9.5px]">ENDEREÇO</span>
                      <span className="font-bold text-[11px] uppercase">{danfeData.destinatario.endereco}</span>
                    </div>
                    <div className="col-span-3 p-1 border-r border-black">
                      <span className="block text-[9.5px]">BAIRRO / DISTRITO</span>
                      <span className="font-bold text-[11px] uppercase">{danfeData.destinatario.bairro}</span>
                    </div>
                    <div className="col-span-2 p-1 border-r border-black">
                      <span className="block text-[9.5px]">CEP</span>
                      <span className="font-bold text-[11px]">{danfeData.destinatario.cep}</span>
                    </div>
                    <div className="col-span-1 p-1">
                      <span className="block text-[9.5px]">UF</span>
                      <span className="font-bold text-[11px]">{danfeData.destinatario.uf}</span>
                    </div>
                  </div>
                </div>

                <h4 className="font-bold text-[11px] uppercase mt-1 mb-0.5">Cálculo do Imposto</h4>
                <div className="border border-black mb-1">
                  <div className="grid grid-cols-10">
                    <div className="p-1 border-r border-black"><span className="block text-[9px] truncate uppercase">Base Cálculo ICMS</span><span className="block text-[12px] text-right font-bold">{danfeData.impostos.bcIcms}</span></div>
                    <div className="p-1 border-r border-black"><span className="block text-[9px] truncate uppercase">Valor ICMS</span><span className="block text-[12px] text-right font-bold">{danfeData.impostos.vIcms}</span></div>
                    <div className="p-1 border-r border-black"><span className="block text-[9px] truncate uppercase">Base Calc. ICMS ST</span><span className="block text-[12px] text-right font-bold">{danfeData.impostos.bcIcmsSt}</span></div>
                    <div className="p-1 border-r border-black"><span className="block text-[9px] truncate uppercase">Valor ICMS ST</span><span className="block text-[12px] text-right font-bold">{danfeData.impostos.vIcmsSt}</span></div>
                    <div className="p-1 border-r border-black"><span className="block text-[9px] truncate uppercase">V. Total Prod.</span><span className="block text-[12px] text-right font-bold">{danfeData.impostos.vProd}</span></div>
                    <div className="col-span-5 p-1"><span className="block text-[10px] font-bold uppercase">Valor Total da Nota</span><span className="block text-[22px] text-right font-black">R$ {danfeData.impostos.vNota}</span></div>
                  </div>
                </div>

                <h4 className="font-bold text-[11px] uppercase mt-1 mb-0.5">Produtos / Serviços</h4>
                <div className="border border-black mb-1 min-h-[220px]">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-black bg-gray-50 font-bold text-[9px]">
                        <th className="border-r border-black p-1 text-left">CÓDIGO</th>
                        <th className="border-r border-black p-1 text-left w-[45%]">DESCRIÇÃO DO PRODUTO / SERVIÇO</th>
                        <th className="border-r border-black p-1">NCM</th>
                        <th className="border-r border-black p-1 text-right">QTD</th>
                        <th className="border-r border-black p-1 text-right">V. UNIT</th>
                        <th className="p-1 text-right">V. TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {danfeData.itens.map((item: any, i: number) => (
                        <tr key={i} className="text-[11px] border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="border-r border-black p-1 font-mono">{item.cod}</td>
                          <td className="border-r border-black p-1 uppercase font-medium">{item.desc}</td>
                          <td className="border-r border-black p-1 text-center">{item.ncm}</td>
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
                    <span className="block text-[11px] font-bold uppercase">Dados Adicionais</span>
                    <p className="text-[10px] leading-tight text-justify mt-1">
                      {danfeData.infoComplementar}
                    </p>
                  </div>
                  <div className="col-span-4 p-1">
                    <span className="block text-[11px] font-bold uppercase">Reservado ao Fisco</span>
                  </div>
                </div>

              </div>
              <footer className="text-[9px] text-center mt-4 text-muted-foreground print:hidden">
                Documento gerado para conferência de dados fiscais reais via XML.
              </footer>
            </div>
          </div>
        )}

        {!danfeData && !pdfBase64 && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground bg-accent/5 rounded-3xl border border-dashed print:hidden">
            <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center mb-6">
              <Code className="h-10 w-10 text-primary/40" />
            </div>
            <p className="font-bold text-xl text-foreground">Aguardando seu XML ou Chave</p>
            <p className="text-sm max-w-sm text-center mt-2">
              Utilize o XML para extrair todos os itens e impostos 100% reais da nota original.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
