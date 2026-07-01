import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TeamsModule } from './teams/teams.module';
import { ReposModule } from './repos/repos.module';
import { ActivityModule } from './activity/activity.module';
import { SummaryModule } from './summary/summary.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    TeamsModule,
    ReposModule,
    ActivityModule,
    SummaryModule,
    WorkspacesModule,
    OnboardingModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
