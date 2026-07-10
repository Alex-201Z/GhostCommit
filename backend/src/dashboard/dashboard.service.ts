export type TodayAgentStatus = 'NOT_INSTALLED' | 'CONNECTED' | 'PAUSED' | 'OFFLINE';

export type TodaySessionState =
  | 'AGENT_NOT_CONNECTED'
  | 'TRACKING_PAUSED'
  | 'NO_SESSION_TODAY'
  | 'ACTIVE_SESSION'
  | 'FINISHED_SESSION';

export type TodayDraftStatus = 'NOT_GENERATED' | 'NEEDS_REVIEW' | 'VALIDATED';

export type TodaySummary = {
  date: string;
  agentStatus: TodayAgentStatus;
  session: {
    state: TodaySessionState;
  };
  draft: {
    status: TodayDraftStatus;
    preview: string[];
  };
  activity: {
    totalSessions: number;
    projectsTouched: number;
    commitsDetected: number;
    workItemsOrBlockers: number;
  };
  recentSessions: Array<{
    id: string;
    time: string;
    project: string;
    durationMinutes: number;
    syncState: 'SYNCED' | 'PENDING' | 'FAILED';
  }>;
  checklist: {
    accountCreated: boolean;
    agentLinked: boolean;
    firstProjectTracked: boolean;
    firstSessionSynced: boolean;
    firstDraftGenerated: boolean;
  };
  canGenerateDraft: boolean;
};

export class DashboardService {
  today(_userId: string): TodaySummary {
    return this.emptyToday();
  }

  emptyToday(): TodaySummary {
    return {
      date: new Date().toISOString().slice(0, 10),
      agentStatus: 'NOT_INSTALLED',
      session: {
        state: 'AGENT_NOT_CONNECTED',
      },
      draft: {
        status: 'NOT_GENERATED',
        preview: [],
      },
      activity: {
        totalSessions: 0,
        projectsTouched: 0,
        commitsDetected: 0,
        workItemsOrBlockers: 0,
      },
      recentSessions: [],
      checklist: {
        accountCreated: true,
        agentLinked: false,
        firstProjectTracked: false,
        firstSessionSynced: false,
        firstDraftGenerated: false,
      },
      canGenerateDraft: false,
    };
  }
}
