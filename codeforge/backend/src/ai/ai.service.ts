import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { AppLogger } from '../logger/logger.service';
import { Finding } from '../analysis/types';

@Injectable()
export class AiService {
  private readonly ai: GoogleGenAI;

  constructor(
    private readonly config: ConfigService,
    private readonly logger: AppLogger,
  ) {
    this.ai = new GoogleGenAI({
      apiKey: this.config.get<string>('GEMINI_API_KEY')!,
    });
  }

  async analyzeChunk(
    systemPrompt: string,
    diffContent: string,
    workerType: string,
  ): Promise<Finding[]> {
    try {
      this.logger.log(`${workerType} — calling Gemini`);

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: diffContent,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0,
        },
      });

      const text = response.text ?? '';

      console.log(
        `${workerType} — Gemini response:`,
        this.parseFindings(text, workerType),
      );

      return this.parseFindings(text, workerType);
    } catch (error) {
      this.logger.error(`${workerType} — Gemini call failed`, String(error));

      return [];
    }
  }

  private parseFindings(text: string, workerType: string): Finding[] {
    try {
      const clean = text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();

      console.log('CLEAN: ', clean);

      const parsed = JSON.parse(clean) as {
        findings: Finding[];
      };

      console.log('Parsed: ', parsed);

      this.logger.log(
        `${workerType} — parsed ${parsed.findings?.length ?? 0} findings`,
      );

      return parsed.findings ?? [];
    } catch {
      this.logger.warn(`${workerType} — failed to parse response as JSON`);

      return [];
    }
  }
}
