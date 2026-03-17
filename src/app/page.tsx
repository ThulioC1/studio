
"use client"

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Building, Loader2, Info, FileText, ScanBarcode } from 'lucide-react';
import { fetchCompanyData } from '@/services/cnpj-service';
import { CompanyData } from '@/types/cnpj';
import { CompanyDetails } from '@/components/company-details';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthButton } from '@/components/auth-button';
import { SearchHistory } from '@/components/search-history';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DanfeLookup } from '@/components/danfe-lookup';

export default function Home() {
  const [cnpj, setCnpj] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<CompanyData | null>(null);
  
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const handleSearch = async (targetCnpj?: string) => {
    const searchCnpj = targetCnpj || cnpj;
    const cleaned = searchCnpj.replace(/\D/g, '');
    
    if (!cleaned || cleaned.length < 14) {
      toast({
        variant: "destructive",
        title: "CNPJ incompleto",
        description: "Digite os 14 números do CNPJ para realizar a busca."
      });
      return;
    }

    setLoading(true);
    setError(null);
    setCompany(null);

    try {
      const data = await fetchCompanyData(cleaned);
      setCompany(data);
      
      if (user) {
        addDoc(collection(db, 'user_profiles', user.uid, 'history'), {
          cnpj: data.cnpj,
          razaoSocial: data.razao_social,
          timestamp: serverTimestamp()
        }).catch(() => {});
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro inesperado.');
      toast({
        variant: "destructive",
        title: "Erro na busca",
        description: err.message || "Não foi possível carregar os dados."
      });
    } finally {
      setLoading(false);
    }
  };

  const formatInput = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 14);
    setCnpj(cleaned);
  };

  return (
    <main className="min-h-screen bg-background print:bg-white print:min-h-0">
      <header className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-50 print:hidden">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-primary">
            <Building className="h-6 w-6" />
            <span className="hidden sm:inline">Consulta Pro</span>
          </div>
          <AuthButton />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 print:py-0 print:px-0">
        <div className="flex flex-col items-center text-center space-y-6 mb-10 print:hidden">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-primary">
              Consulta de Dados Empresariais
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Pesquise CNPJ e Notas Fiscais (DANFE) de forma rápida e imprima em PDF.
            </p>
          </div>
        </div>

        <Tabs defaultValue="cnpj" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8 print:hidden">
            <TabsTrigger value="cnpj" className="gap-2">
              <Building className="h-4 w-4" />
              Empresa (CNPJ)
            </TabsTrigger>
            <TabsTrigger value="danfe" className="gap-2">
              <FileText className="h-4 w-4" />
              DANFE (Nota Fiscal)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cnpj">
            <div className="flex flex-col items-center mb-12 print:hidden">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSearch(); }} 
                className="w-full max-w-2xl"
              >
                <div className="relative group">
                  <Input
                    type="text"
                    placeholder="Digite o CNPJ (apenas números)..."
                    value={cnpj}
                    onChange={(e) => formatInput(e.target.value)}
                    className="h-16 pl-14 pr-32 text-lg rounded-2xl shadow-lg border-2 border-transparent focus-visible:border-accent transition-all bg-card"
                  />
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Button 
                      type="submit" 
                      size="lg" 
                      disabled={loading || cnpj.length < 14}
                      className="h-10 px-6 rounded-xl font-bold"
                    >
                      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Pesquisar'}
                    </Button>
                  </div>
                </div>
              </form>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">
              <div className="xl:col-span-3 space-y-8 print:col-span-4">
                {loading && (
                  <div className="flex flex-col items-center justify-center py-20 space-y-6 bg-card rounded-2xl border border-dashed print:hidden">
                    <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <p className="text-muted-foreground font-medium">Consultando base de dados oficial...</p>
                  </div>
                )}

                {error && (
                  <Alert variant="destructive" className="animate-in slide-in-from-top-2 print:hidden">
                    <Search className="h-4 w-4" />
                    <AlertTitle>Não foi possível completar a busca</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {company && <CompanyDetails company={company} />}
                
                {!company && !loading && !error && (
                  <div className="flex flex-col items-center justify-center py-24 text-muted-foreground bg-accent/5 rounded-3xl border print:hidden">
                    <Building className="h-16 w-16 mb-4 opacity-20" />
                    <p>Nenhuma empresa selecionada. Realize uma busca acima.</p>
                  </div>
                )}
              </div>

              <div className="xl:col-span-1 print:hidden">
                {user ? (
                  <SearchHistory onSelect={(val) => { setCnpj(val); handleSearch(val); }} />
                ) : (
                  <Card className="bg-primary/5 border-primary/10">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2 text-primary font-semibold">
                        <Info className="h-4 w-4" />
                        Histórico de Buscas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Faça login com o Google para salvar suas pesquisas e acessá-las rapidamente de qualquer lugar.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="danfe">
            <DanfeLookup />
          </TabsContent>
        </Tabs>
      </div>

      <footer className="mt-20 py-12 border-t text-center text-sm text-muted-foreground bg-card/30 print:hidden">
        <p>© {new Date().getFullYear()} Consulta Pro. Dados públicos e consultas oficiais.</p>
      </footer>
    </main>
  );
}
