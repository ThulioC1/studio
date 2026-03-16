"use client"

import { CompanyData, formatCnpj, formatCurrency, formatDate, formatPhone } from '@/types/cnpj';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataField } from './data-field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, Users, Activity, Phone, Printer } from 'lucide-react';

interface CompanyDetailsProps {
  company: CompanyData;
}

export function CompanyDetails({ company }: CompanyDetailsProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header do Card com Botão de Imprimir */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-card rounded-2xl border shadow-sm print:border-none print:shadow-none print:p-0">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold text-primary">{company.razao_social}</h2>
            <Badge variant={company.descricao_situacao_cadastral === 'ATIVA' ? 'default' : 'destructive'} className="rounded-full print:bg-black print:text-white">
              {company.descricao_situacao_cadastral}
            </Badge>
          </div>
          <p className="text-muted-foreground font-medium">
            {company.nome_fantasia || 'Sem nome fantasia'} • {formatCnpj(company.cnpj)}
          </p>
        </div>
        <Button 
          onClick={handlePrint} 
          variant="outline" 
          className="gap-2 print:hidden"
        >
          <Printer className="h-4 w-4" />
          Imprimir PDF
        </Button>
      </div>

      {/* Visualização de Abas (Escondida na Impressão) */}
      <div className="w-full print:hidden">
        <Tabs defaultValue="geral" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full mb-6">
            <TabsTrigger value="geral" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span>Geral</span>
            </TabsTrigger>
            <TabsTrigger value="contato" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>Contato</span>
            </TabsTrigger>
            <TabsTrigger value="atividades" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span>Atividades</span>
            </TabsTrigger>
            <TabsTrigger value="endereco" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>Endereço</span>
            </TabsTrigger>
            <TabsTrigger value="socios" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Sócios</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="space-y-4">
            <Card>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <DataField label="Razão Social" value={company.razao_social} />
                <DataField label="CNPJ" value={formatCnpj(company.cnpj)} copyValue={company.cnpj} />
                <DataField label="Nome Fantasia" value={company.nome_fantasia} />
                <DataField label="Data de Abertura" value={formatDate(company.data_inicio_atividade)} />
                <DataField label="Natureza Jurídica" value={company.natureza_juridica} />
                <DataField label="Porte" value={company.porte} />
                <DataField label="Capital Social" value={formatCurrency(company.capital_social)} />
                <DataField label="Situação Cadastral" value={company.descricao_situacao_cadastral} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contato" className="space-y-4">
            <Card>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <DataField label="E-mail" value={company.email?.toLowerCase()} />
                <DataField label="Telefone Principal" value={formatPhone(undefined, company.ddd_telefone_1)} />
                <DataField label="Telefone Secundário" value={formatPhone(undefined, company.ddd_telefone_2)} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="atividades" className="space-y-4">
            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary">
                    Atividade Principal
                  </h3>
                  <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
                    <p className="text-sm font-medium">{company.cnae_fiscal_descricao}</p>
                  </div>
                </div>
                {company.cnaes_secundarios.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Atividades Secundárias</h3>
                    <ul className="space-y-2">
                      {company.cnaes_secundarios.map((cnae, i) => (
                        <li key={i} className="text-sm p-3 border rounded-md bg-card">
                          {cnae.descricao}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="endereco" className="space-y-4">
            <Card>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <DataField label="Logradouro" value={company.logradouro} />
                <DataField label="Número" value={company.numero} />
                <DataField label="Complemento" value={company.complemento} />
                <DataField label="Bairro" value={company.bairro} />
                <DataField label="CEP" value={company.cep} />
                <DataField label="Município" value={company.municipio} />
                <DataField label="UF" value={company.uf} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="socios" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                {company.qsa.length > 0 ? (
                  <div className="space-y-4">
                    {company.qsa.map((socio, i) => (
                      <div key={i} className="flex flex-col p-4 border rounded-md bg-card hover:bg-accent/5 transition-colors">
                        <span className="text-sm font-bold text-primary">{socio.nome_socio}</span>
                        <span className="text-xs text-muted-foreground">{socio.qualificacao_socio}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum sócio informado publicamente.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Layout de Impressão (Aparece apenas no PDF/Impressora) */}
      <div className="hidden print:block space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="border p-4 rounded-lg">
            <h3 className="text-sm font-bold border-b mb-2 pb-1 uppercase">Dados Gerais</h3>
            <div className="space-y-1 text-sm">
              <p><strong>CNPJ:</strong> {formatCnpj(company.cnpj)}</p>
              <p><strong>Razão Social:</strong> {company.razao_social}</p>
              <p><strong>Nome Fantasia:</strong> {company.nome_fantasia || '-'}</p>
              <p><strong>Abertura:</strong> {formatDate(company.data_inicio_atividade)}</p>
              <p><strong>Situação:</strong> {company.descricao_situacao_cadastral}</p>
              <p><strong>Capital Social:</strong> {formatCurrency(company.capital_social)}</p>
            </div>
          </div>
          <div className="border p-4 rounded-lg">
            <h3 className="text-sm font-bold border-b mb-2 pb-1 uppercase">Contato</h3>
            <div className="space-y-1 text-sm">
              <p><strong>E-mail:</strong> {company.email || '-'}</p>
              <p><strong>Telefone 1:</strong> {formatPhone(undefined, company.ddd_telefone_1)}</p>
              <p><strong>Telefone 2:</strong> {formatPhone(undefined, company.ddd_telefone_2)}</p>
            </div>
          </div>
          <div className="border p-4 rounded-lg col-span-2">
            <h3 className="text-sm font-bold border-b mb-2 pb-1 uppercase">Endereço</h3>
            <p className="text-sm">
              {company.logradouro}, {company.numero} {company.complemento ? `(${company.complemento})` : ''} - 
              {company.bairro}, {company.municipio}/{company.uf} - CEP: {company.cep}
            </p>
          </div>
          <div className="border p-4 rounded-lg col-span-2">
            <h3 className="text-sm font-bold border-b mb-2 pb-1 uppercase">Atividade Principal</h3>
            <p className="text-sm">{company.cnae_fiscal_descricao}</p>
          </div>
          {company.qsa.length > 0 && (
            <div className="border p-4 rounded-lg col-span-2">
              <h3 className="text-sm font-bold border-b mb-2 pb-1 uppercase">Quadro de Sócios (QSA)</h3>
              <ul className="grid grid-cols-2 gap-2 mt-2">
                {company.qsa.map((s, i) => (
                  <li key={i} className="text-xs border-b pb-1">
                    <strong>{s.nome_socio}</strong><br/>
                    <span className="text-muted-foreground">{s.qualificacao_socio}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <footer className="text-[10px] text-center text-muted-foreground pt-10 border-t">
          Documento gerado em {new Date().toLocaleString('pt-BR')} via Consulta CNPJ Pro.
        </footer>
      </div>
    </div>
  );
}
