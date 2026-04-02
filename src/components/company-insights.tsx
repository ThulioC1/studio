
"use client"

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { summarizeCompanyInsights } from '@/ai/flows/summarize-company-insights';
import { CompanyData, formatDate } from '@/types/cnpj';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CompanyInsightsProps {
  company: CompanyData;
}

export function CompanyInsights({ company }: CompanyInsightsProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getInsights() {
      setLoading(true);
      setError(null);
      try {
        const insights = await summarizeCompanyInsights({
          cnpj: company.taxId,
          razaoSocial: company.name,
          nomeFantasia: company.alias,
          situacaoCadastral: company.status.text,
          dataSituacaoCadastral: company.status.date,
          atividadesPrincipais: [company.mainActivity.text],
          atividadesSecundarias: company.sideActivities.map(c => c.text),
          naturezaJuridica: company.legalNature.text,
          endereco: `${company.address.street}, ${company.address.number}, ${company.address.district}, ${company.address.city} - ${company.address.state}`,
          dataAbertura: formatDate(company.founded),
          capitalSocial: company.equity.toString(),
          porte: company.size.text,
        });
        setSummary(insights);
      } catch (err) {
        setError('Ocorreu um erro ao gerar insights inteligentes.');
      } finally {
        setLoading(false);
      }
    }

    getInsights();
  }, [company]);

  return (
    <Card className="border-accent/20 bg-accent/5 overflow-hidden">
      <CardHeader className="bg-accent/10 border-b border-accent/10">
        <CardTitle className="flex items-center gap-2 text-primary">
          <Sparkles className="h-5 w-5 text-accent" />
          Insights Essenciais (AI)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {loading && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-sm text-muted-foreground animate-pulse">
              Analisando dados da empresa...
            </p>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {summary && !loading && !error && (
          <div className="prose prose-sm max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
            {summary}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
