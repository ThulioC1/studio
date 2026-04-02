
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

  const primaryEmail = company?.emails?.[0]?.address;
  const primaryPhone = company?.phones?.[0] ? formatPhone(company.phones[0].area, company.phones[0].number) : undefined;
  const statusText = company?.status?.text || 'Desconhecido';

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header do Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-card rounded-2xl border shadow-sm print:border-none print:shadow-none print:p-0">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold text-primary">{company?.name || 'Razão Social não informada'}</h2>
            <Badge variant={statusText === 'Ativa' ? 'default' : 'destructive'} className="rounded-full print:bg-black print:text-white">
              {statusText}
            </Badge>
          </div>
          <p className="text-muted-foreground font-medium">
            {company?.alias || 'Sem nome fantasia'} • {formatCnpj(company?.taxId || '')}
          </p>
          {(primaryEmail || primaryPhone) && (
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-primary font-medium print:hidden">
              {primaryEmail && <span className="flex items-center gap-1 font-semibold">{primaryEmail.toLowerCase()}</span>}
              {primaryPhone && <span className="flex items-center gap-1 font-semibold">{primaryPhone}</span>}
            </div>
          )}
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

      {/* Visualização de Abas */}
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
                <DataField label="Razão Social" value={company?.name} />
                <DataField label="CNPJ" value={formatCnpj(company?.taxId || '')} copyValue={company?.taxId} />
                <DataField label="Nome Fantasia" value={company?.alias} />
                <DataField label="Data de Abertura" value={formatDate(company?.founded || '')} />
                <DataField label="Natureza Jurídica" value={company?.legalNature?.text} />
                <DataField label="Porte" value={company?.size?.text} />
                <DataField label="Capital Social" value={formatCurrency(company?.equity || 0)} />
                <DataField label="Situação Cadastral" value={company?.status?.text} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contato" className="space-y-4">
            <Card>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {company?.emails?.map((e, i) => (
                  <DataField key={i} label={`E-mail ${i + 1}`} value={e.address?.toLowerCase()} />
                ))}
                {company?.phones?.map((p, i) => (
                  <DataField key={i} label={`Telefone ${i + 1}`} value={formatPhone(p.area, p.number)} />
                ))}
                {(!company?.emails || company?.emails.length === 0) && (!company?.phones || company?.phones.length === 0) && (
                  <p className="text-sm text-muted-foreground col-span-2 text-center py-4">Nenhum dado de contato disponível.</p>
                )}
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
                    <p className="text-sm font-medium">{company?.mainActivity?.text || '-'}</p>
                  </div>
                </div>
                {company?.sideActivities && company.sideActivities.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Atividades Secundárias</h3>
                    <ul className="space-y-2">
                      {company.sideActivities.map((cnae, i) => (
                        <li key={i} className="text-sm p-3 border rounded-md bg-card">
                          {cnae.text}
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
                <DataField label="Logradouro" value={company?.address?.street} />
                <DataField label="Número" value={company?.address?.number} />
                <DataField label="Complemento" value={company?.address?.details} />
                <DataField label="Bairro" value={company?.address?.district} />
                <DataField label="CEP" value={company?.address?.zip} />
                <DataField label="Município" value={company?.address?.city} />
                <DataField label="UF" value={company?.address?.state} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="socios" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                {company?.members && company.members.length > 0 ? (
                  <div className="space-y-4">
                    {company.members.map((socio, i) => (
                      <div key={i} className="flex flex-col p-4 border rounded-md bg-card hover:bg-accent/5 transition-colors">
                        <span className="text-sm font-bold text-primary">{socio.name}</span>
                        <span className="text-xs text-muted-foreground">{socio?.role?.text}</span>
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

      {/* Layout de Impressão */}
      <div className="hidden print:block space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="border p-4 rounded-lg">
            <h3 className="text-sm font-bold border-b mb-2 pb-1 uppercase">Dados Gerais</h3>
            <div className="space-y-1 text-sm">
              <p><strong>CNPJ:</strong> {formatCnpj(company?.taxId || '')}</p>
              <p><strong>Razão Social:</strong> {company?.name || 'N/A'}</p>
              <p><strong>Nome Fantasia:</strong> {company?.alias || '-'}</p>
              <p><strong>Abertura:</strong> {formatDate(company?.founded || '')}</p>
              <p><strong>Situação:</strong> {company?.status?.text || '-'}</p>
              <p><strong>Capital Social:</strong> {formatCurrency(company?.equity || 0)}</p>
            </div>
          </div>
          <div className="border p-4 rounded-lg">
            <h3 className="text-sm font-bold border-b mb-2 pb-1 uppercase">Contato</h3>
            <div className="space-y-1 text-sm">
              {company?.emails?.map((e, i) => (
                <p key={i}><strong>E-mail {i+1}:</strong> {e.address?.toLowerCase()}</p>
              ))}
              {company?.phones?.map((p, i) => (
                <p key={i}><strong>Telefone {i+1}:</strong> {formatPhone(p.area, p.number)}</p>
              ))}
            </div>
          </div>
          <div className="border p-4 rounded-lg col-span-2">
            <h3 className="text-sm font-bold border-b mb-2 pb-1 uppercase">Endereço</h3>
            <p className="text-sm">
              {company?.address?.street}, {company?.address?.number} {company?.address?.details ? `(${company?.address?.details})` : ''} - 
              {company?.address?.district}, {company?.address?.city}/{company?.address?.state} - CEP: {company?.address?.zip}
            </p>
          </div>
          <div className="border p-4 rounded-lg col-span-2">
            <h3 className="text-sm font-bold border-b mb-2 pb-1 uppercase">Atividade Principal</h3>
            <p className="text-sm">{company?.mainActivity?.text || '-'}</p>
          </div>
          {company?.members && company.members.length > 0 && (
            <div className="border p-4 rounded-lg col-span-2">
              <h3 className="text-sm font-bold border-b mb-2 pb-1 uppercase">Quadro de Sócios (QSA)</h3>
              <ul className="grid grid-cols-2 gap-2 mt-2">
                {company.members.map((s, i) => (
                  <li key={i} className="text-xs border-b pb-1">
                    <strong>{s.name}</strong><br/>
                    <span className="text-muted-foreground">{s?.role?.text || '-'}</span>
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
