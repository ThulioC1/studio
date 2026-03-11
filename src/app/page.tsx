"use client"

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Building, Loader2, Info } from 'lucide-react';
import { fetchCompanyData } from '@/services/cnpj-service';
import { CompanyData } from '@/types/cnpj';
import { CompanyDetails } from '@/components/company-details';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Toaster } from '@/components/ui/toaster';

export default function Home() {
  const [cnpj, setCnpj] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<CompanyData | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!cnpj) return;

    setLoading(true);
    setError(null);
    setCompany(null);

    try {
      const data = await fetchCompanyData(cnpj);
      setCompany(data);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const formatInput = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 14);
    setCnpj(cleaned);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-12 md:py-20">
      <div className="flex flex-col items-center text-center space-y-6 mb-16">
        <div className="bg-primary/10 p-4 rounded-2xl">
          <Building className="h-10 w-10 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-primary">
            Consulta CNPJ Pro
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Acesse dados públicos de empresas brasileiras com rapidez e receba insights gerados por inteligência artificial.
          </p>
        </div>

        <form onSubmit={handleSearch} className="w-full max-w-2xl mt-8">
          <div className="relative group">
            <Input
              type="text"
              placeholder="Digite apenas os números do CNPJ..."
              value={cnpj}
              onChange={(e) => formatInput(e.target.value)}
              className="h-16 pl-14 pr-32 text-lg rounded-2xl shadow-lg border-2 border-transparent focus-visible:border-accent group-hover:border-accent/30 transition-all bg-card"
            />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground group-focus-within:text-accent transition-colors" />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Button 
                type="submit" 
                size="lg" 
                disabled={loading || cnpj.length < 14}
                className="h-10 px-6 rounded-xl font-bold bg-accent hover:bg-accent/90 text-accent-foreground shadow-md transition-all active:scale-95"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Pesquisar'}
              </Button>
            </div>
          </div>
        </form>

        {!company && !loading && !error && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-accent/5 px-4 py-2 rounded-full border border-accent/10 mt-4">
            <Info className="h-4 w-4" />
            <span>Pesquise 14 dígitos para consultar.</span>
          </div>
        )}
      </div>

      <div className="w-full">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="relative">
              <div className="h-20 w-20 rounded-full border-4 border-accent/20 border-t-accent animate-spin" />
              <Building className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-accent animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-primary">Buscando informações...</p>
              <p className="text-muted-foreground">Isso pode levar alguns segundos dependendo da base de dados.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="max-w-2xl mx-auto">
            <Alert variant="destructive" className="animate-in zoom-in-95 duration-300">
              <Search className="h-4 w-4" />
              <AlertTitle>Erro na busca</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {company && <CompanyDetails company={company} />}
      </div>

      <Toaster />
      
      <footer className="mt-20 pt-8 border-t text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Consulta CNPJ Pro. Dados fornecidos por bases públicas da Receita Federal.</p>
      </footer>
    </main>
  );
}