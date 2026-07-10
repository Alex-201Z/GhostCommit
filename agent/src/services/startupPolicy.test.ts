import { describe, expect, it } from 'vitest';
import { getStartupPolicy } from './startupPolicy';

describe('agent startup policy', () => {
  it('does not automatically watch previously configured paths at startup', () => {
    expect(getStartupPolicy(['C:\\Users\\dev\\secret-project'])).toEqual({
      shouldAutoWatchConfiguredPaths: false,
      shouldShowSetupPrompt: false,
    });
  });

  it('may show setup guidance when no project has ever been selected', () => {
    expect(getStartupPolicy([])).toEqual({
      shouldAutoWatchConfiguredPaths: false,
      shouldShowSetupPrompt: true,
    });
  });
});
