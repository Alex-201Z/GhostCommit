import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class LlmService {
  private openai: OpenAI | null = null;
  private useOpenAI: boolean;

  constructor(private configService: ConfigService) {
    const openaiKey = this.configService.get('OPENAI_API_KEY');
    const anthropicKey = this.configService.get('ANTHROPIC_API_KEY');

    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
      this.useOpenAI = true;
    } else if (anthropicKey) {
      this.useOpenAI = false;
      // Anthropic client would be initialized here
    }
  }

  async generateSummary(activityData: {
    sessions: any[];
    totalDuration: number;
    totalCommits: number;
    filesModified: string[];
  }): Promise<string> {
    const prompt = this.buildPrompt(activityData);

    if (this.useOpenAI && this.openai) {
      return this.generateWithOpenAI(prompt);
    } else {
      return this.generateWithAnthropic(prompt);
    }
  }

  private buildPrompt(data: {
    sessions: any[];
    totalDuration: number;
    totalCommits: number;
    filesModified: string[];
  }): string {
    const hours = Math.floor(data.totalDuration / 3600000);
    const minutes = Math.floor((data.totalDuration % 3600000) / 60000);

    return `Tu es un assistant qui génère des résumés de travail pour des développeurs.

Données d'activité du jour:
- Durée totale: ${hours}h ${minutes}min
- Nombre de commits: ${data.totalCommits}
- Fichiers modifiés: ${data.filesModified.slice(0, 20).join(', ')}${data.filesModified.length > 20 ? '...' : ''}

Informations des sessions:
${data.sessions.map((s, i) => `
Session ${i + 1}:
- Durée: ${Math.floor((s.durationMs || 0) / 60000)}min
- Commits: ${s.commitCount}
- Fichiers: ${(s.filesModified as string[] || []).slice(0, 5).join(', ')}
`).join('\n')}

Génère un résumé COURT (2-3 phrases maximum) et FACTUEL du travail effectué.
Format: "Travail sur X : [description courte]. [Réalisation principale si applicable]."

Ne mentionne PAS les durées ou le nombre de commits. Focus sur QUOI a été fait, pas combien de temps.
Réponds UNIQUEMENT avec le résumé, sans introduction ni conclusion.`;
  }

  private async generateWithOpenAI(prompt: string): Promise<string> {
    if (!this.openai) {
      return this.getFallbackSummary();
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: this.configService.get('OPENAI_MODEL') || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Tu es un assistant qui génère des résumés courts et factuels de travail de développeurs.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
      });

      return response.choices[0]?.message?.content?.trim() || this.getFallbackSummary();
    } catch (error) {
      console.error('Error generating summary with OpenAI:', error);
      return this.getFallbackSummary();
    }
  }

  private async generateWithAnthropic(prompt: string): Promise<string> {
    // For now, return fallback. In production, implement Anthropic API call
    // using fetch or axios to call the Anthropic Messages API
    console.log('Anthropic integration not fully implemented yet');
    return this.getFallbackSummary();
  }

  private getFallbackSummary(): string {
    return 'Travail de développement effectué. Session d\'activité détectée.';
  }
}
