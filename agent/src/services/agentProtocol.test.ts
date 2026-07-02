import { describe, expect, it, vi } from 'vitest';
import { extractGhostCommitLink, GhostCommitProtocolHandler } from './agentProtocol';

describe('agent protocol handling', () => {
  it('extracts the first GhostCommit deep link from process arguments', () => {
    expect(extractGhostCommitLink(['ghostcommit.exe', '--flag', 'ghostcommit://agent/link?code=GC-ABCD23'])).toBe(
      'ghostcommit://agent/link?code=GC-ABCD23',
    );
  });

  it('ignores non-GhostCommit links and never returns unsafe adjacent arguments', () => {
    expect(extractGhostCommitLink(['ghostcommit.exe', 'https://example.test?token=abc', '--hostname=workstation'])).toBeNull();
  });

  it('queues protocol links until the agent is ready, then handles them in order', async () => {
    const handleLink = vi.fn().mockResolvedValue(undefined);
    const handler = new GhostCommitProtocolHandler(handleLink);

    handler.receive('ghostcommit://agent/link?code=GC-ABCD23');
    expect(handleLink).not.toHaveBeenCalled();

    await handler.markReady();

    expect(handleLink).toHaveBeenCalledWith('ghostcommit://agent/link?code=GC-ABCD23');
  });
});
