import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SummaryService } from './summary.service';
import { ExportService } from './export.service';
import { GenerateSummaryDto, UpdateSummaryDto, ExportSummaryDto } from './dto/summary.dto';
import { Request, Response } from 'express';

@ApiTags('Summary')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('summary')
export class SummaryController {
  constructor(
    private summaryService: SummaryService,
    private exportService: ExportService,
  ) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate daily summary for a specific date' })
  async generate(@Req() req: Request, @Body() dto: GenerateSummaryDto) {
    return this.summaryService.generateForDate(
      (req.user as any).id,
      new Date(dto.date),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all summaries for current user' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  async getMySummaries(
    @Req() req: Request,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.summaryService.findByUser((req.user as any).id, {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get summary by ID' })
  async getSummary(@Param('id') id: string) {
    return this.summaryService.findOne(id);
  }

  @Get('date/:date')
  @ApiOperation({ summary: 'Get summary for a specific date' })
  async getSummaryByDate(@Req() req: Request, @Param('date') date: string) {
    return this.summaryService.findByUserAndDate(
      (req.user as any).id,
      new Date(date),
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update summary' })
  async update(@Param('id') id: string, @Body() dto: UpdateSummaryDto) {
    return this.summaryService.update(id, dto);
  }

  @Post(':id/validate')
  @HttpCode(200)
  @ApiOperation({ summary: 'Validate summary' })
  async validate(@Param('id') id: string) {
    return this.summaryService.validate(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete summary' })
  async delete(@Param('id') id: string) {
    return this.summaryService.delete(id);
  }

  @Post('export')
  @ApiOperation({ summary: 'Export summaries to markdown or PDF' })
  async export(
    @Req() req: Request,
    @Res() res: Response,
    @Body() dto: ExportSummaryDto,
  ) {
    const user = req.user;
    const summaries = await this.summaryService.findByDateRange(
      (user as any).id,
      new Date(dto.startDate),
      new Date(dto.endDate),
    );

    if (dto.format === 'markdown') {
      const markdown = await this.exportService.exportToMarkdown(summaries, user);
      res.setHeader('Content-Type', 'text/markdown');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="ghostcommit-report-${dto.startDate}-${dto.endDate}.md"`,
      );
      res.send(markdown);
    } else if (dto.format === 'pdf') {
      const pdf = await this.exportService.exportToPDF(summaries, user);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="ghostcommit-report-${dto.startDate}-${dto.endDate}.pdf"`,
      );
      res.send(pdf);
    }
  }
}
