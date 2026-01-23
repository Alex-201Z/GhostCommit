import { Injectable } from '@nestjs/common';
import { marked } from 'marked';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

@Injectable()
export class ExportService {
  async exportToMarkdown(summaries: any[], user: any): Promise<string> {
    let markdown = `# GhostCommit - Rapport d'activité\n\n`;
    markdown += `**Développeur:** ${user.name || user.email}\n`;
    markdown += `**Période:** ${this.formatDate(summaries[0]?.date)} - ${this.formatDate(summaries[summaries.length - 1]?.date)}\n\n`;
    markdown += `---\n\n`;

    summaries.forEach((summary) => {
      markdown += `## ${this.formatDate(summary.date)}\n\n`;
      markdown += `${summary.summary}\n\n`;

      markdown += `**Statistiques:**\n`;
      markdown += `- Durée totale: ${this.formatDuration(summary.totalDurationMs)}\n`;
      markdown += `- Commits: ${summary.totalCommits}\n`;
      markdown += `- Fichiers modifiés: ${summary.totalFiles}\n\n`;

      if (summary.highlights?.topFiles?.length > 0) {
        markdown += `**Fichiers principaux:**\n`;
        summary.highlights.topFiles.slice(0, 5).forEach((file: string) => {
          markdown += `- \`${file}\`\n`;
        });
        markdown += `\n`;
      }

      markdown += `---\n\n`;
    });

    return markdown;
  }

  async exportToPDF(summaries: any[], user: any): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage([595, 842]); // A4 size
    let yPosition = 800;
    const margin = 50;
    const lineHeight = 20;

    // Title
    page.drawText('GhostCommit - Rapport d\'activité', {
      x: margin,
      y: yPosition,
      size: 20,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    yPosition -= 30;

    // User info
    page.drawText(`Développeur: ${user.name || user.email}`, {
      x: margin,
      y: yPosition,
      size: 12,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    });
    yPosition -= lineHeight;

    page.drawText(
      `Période: ${this.formatDate(summaries[0]?.date)} - ${this.formatDate(summaries[summaries.length - 1]?.date)}`,
      {
        x: margin,
        y: yPosition,
        size: 12,
        font: font,
        color: rgb(0.3, 0.3, 0.3),
      },
    );
    yPosition -= 40;

    // Summaries
    for (const summary of summaries) {
      // Check if we need a new page
      if (yPosition < 100) {
        page = pdfDoc.addPage([595, 842]);
        yPosition = 800;
      }

      // Date header
      page.drawText(this.formatDate(summary.date), {
        x: margin,
        y: yPosition,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 25;

      // Summary text (word wrap)
      const lines = this.wrapText(summary.summary, 70);
      lines.forEach((line: string) => {
        if (yPosition < 100) {
          page = pdfDoc.addPage([595, 842]);
          yPosition = 800;
        }
        page.drawText(line, {
          x: margin,
          y: yPosition,
          size: 11,
          font: font,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;
      });
      yPosition -= 10;

      // Statistics
      page.drawText('Statistiques:', {
        x: margin,
        y: yPosition,
        size: 11,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= lineHeight;

      const stats = [
        `  Durée: ${this.formatDuration(summary.totalDurationMs)}`,
        `  Commits: ${summary.totalCommits}`,
        `  Fichiers modifiés: ${summary.totalFiles}`,
      ];

      stats.forEach((stat) => {
        if (yPosition < 100) {
          page = pdfDoc.addPage([595, 842]);
          yPosition = 800;
        }
        page.drawText(stat, {
          x: margin,
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0.2, 0.2, 0.2),
        });
        yPosition -= lineHeight;
      });

      yPosition -= 30;
    }

    return Buffer.from(await pdfDoc.save());
  }

  private formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  private formatDuration(ms: number): string {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}min`;
  }

  private wrapText(text: string, maxLength: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach((word) => {
      if ((currentLine + word).length <= maxLength) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });

    if (currentLine) lines.push(currentLine);
    return lines;
  }
}
