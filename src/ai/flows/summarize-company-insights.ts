'use server';
/**
 * @fileOverview This file implements a Genkit flow to summarize key company insights
 * based on provided CNPJ data. It acts as an AI business analyst.
 *
 * - summarizeCompanyInsights - The main function to call the AI flow.
 * - SummarizeCompanyInsightsInput - The input type for the summarizeCompanyInsights function.
 * - SummarizeCompanyInsightsOutput - The return type for the summarizeCompanyInsights function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SummarizeCompanyInsightsInputSchema = z.object({
  cnpj: z
    .string()
    .describe('The CNPJ (Cadastro Nacional da Pessoa Jurídica) number of the company.'),
  razaoSocial: z.string().describe('The legal corporate name of the company.'),
  nomeFantasia: z
    .string()
    .optional()
    .describe('The trade name or business name of the company, if available.'),
  situacaoCadastral: z
    .string()
    .describe('The cadastral status of the company (e.g., Ativa, Suspensa, Baixada).'),
  dataSituacaoCadastral: z
    .string()
    .optional()
    .describe('The date of the current cadastral status.'),
  atividadesPrincipais: z
    .array(z.string())
    .describe('A list of primary business activities of the company.'),
  atividadesSecundarias: z
    .array(z.string())
    .optional()
    .describe('A list of secondary business activities of the company.'),
  naturezaJuridica: z
    .string()
    .describe('The legal nature of the company (e.g., Sociedade Empresária Limitada).'),
  endereco: z.string().describe('The full address of the company.'),
  dataAbertura: z.string().describe('The opening date of the company.'),
  capitalSocial: z
    .string()
    .optional()
    .describe('The stated capital of the company.'),
  porte: z
    .string()
    .optional()
    .describe('The size classification of the company (e.g., Microempresa, Empresa de Pequeno Porte).'),
});

export type SummarizeCompanyInsightsInput = z.infer<
  typeof SummarizeCompanyInsightsInputSchema
>;

const SummarizeCompanyInsightsOutputSchema = z
  .string()
  .describe('An AI-generated summary of key company insights.');

export type SummarizeCompanyInsightsOutput = z.infer<
  typeof SummarizeCompanyInsightsOutputSchema
>;

export async function summarizeCompanyInsights(
  input: SummarizeCompanyInsightsInput
): Promise<SummarizeCompanyInsightsOutput> {
  return summarizeCompanyInsightsFlow(input);
}

const summarizeCompanyInsightsPrompt = ai.definePrompt({
  name: 'summarizeCompanyInsightsPrompt',
  input: { schema: SummarizeCompanyInsightsInputSchema },
  output: { schema: SummarizeCompanyInsightsOutputSchema },
  prompt: `You are an expert business analyst.

Your task is to provide a concise summary of the key insights for the company described below.
Focus on its cadastral status, main activities, and any other crucial information that helps to quickly understand the company's profile.

Company Details:
CNPJ: {{{cnpj}}}
Razão Social: {{{razaoSocial}}}
{{#if nomeFantasia}}Nome Fantasia: {{{nomeFantasia}}}{{/if}}
Situação Cadastral: {{{situacaoCadastral}}}{{#if dataSituacaoCadastral}} (desde {{{dataSituacaoCadastral}}}){{/if}}
Atividades Principais: {{#each atividadesPrincipais}}- {{{this}}}\n{{/each}}
{{#if atividadesSecundarias}}Atividades Secundárias: {{#each atividadesSecundarias}}- {{{this}}}\n{{/each}}{{/if}}
Natureza Jurídica: {{{naturezaJuridica}}}
Endereço: {{{endereco}}}
Data de Abertura: {{{dataAbertura}}}
{{#if capitalSocial}}Capital Social: {{{capitalSocial}}}{{/if}}
{{#if porte}}Porte: {{{porte}}}{{/if}}

Provide a summary that highlights the most important aspects for someone needing a quick overview.`,
});

const summarizeCompanyInsightsFlow = ai.defineFlow(
  {
    name: 'summarizeCompanyInsightsFlow',
    inputSchema: SummarizeCompanyInsightsInputSchema,
    outputSchema: SummarizeCompanyInsightsOutputSchema,
  },
  async (input) => {
    const { output } = await summarizeCompanyInsightsPrompt(input);
    return output!;
  }
);
