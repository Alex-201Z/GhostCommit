import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('Dashboard phase 2 contract', () => {
  it('exposes authenticated GET /dashboard/today', () => {
    const prototype = DashboardController.prototype as unknown as Record<string, unknown>;
    const handler = prototype.today as object | undefined;

    expect(handler).toBeDefined();
    expect(Reflect.getMetadata(PATH_METADATA, handler as object)).toBe('today');
    expect(Reflect.getMetadata(METHOD_METADATA, handler as object)).toBe(RequestMethod.GET);
  });

  it('returns a privacy-safe empty today summary without performance scoring', () => {
    const service = new DashboardService();
    const summary = service.emptyToday();

    expect(summary.agentStatus).toBe('NOT_INSTALLED');
    expect(summary.session.state).toBe('AGENT_NOT_CONNECTED');
    expect(summary.draft.status).toBe('NOT_GENERATED');
    expect(summary.activity.totalSessions).toBe(0);
    expect(summary.recentSessions).toEqual([]);
    expect(JSON.stringify(summary).toLowerCase()).not.toContain('score');
    expect(JSON.stringify(summary).toLowerCase()).not.toContain('path');
    expect(JSON.stringify(summary).toLowerCase()).not.toContain('hostname');
  });
});
