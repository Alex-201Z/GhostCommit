import { Module } from '@nestjs/common';
import { SummaryController } from './summary.controller';
import { SummaryService } from './summary.service';
import { LlmService } from './llm.service';
import { ExportService } from './export.service';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [ActivityModule],
  controllers: [SummaryController],
  providers: [SummaryService, LlmService, ExportService],
  exports: [SummaryService],
})
export class SummaryModule {}
