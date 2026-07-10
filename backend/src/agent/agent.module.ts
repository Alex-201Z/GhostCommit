import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { AgentTokenGuard } from './agent-token.guard';

@Module({
  imports: [AuthModule],
  controllers: [AgentController],
  providers: [AgentService, AgentTokenGuard],
})
export class AgentModule {}
