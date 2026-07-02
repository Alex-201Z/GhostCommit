export type ProtocolLinkHandler = (linkUrl: string) => Promise<void> | void;

export function extractGhostCommitLink(argv: string[]): string | null {
  return argv.find((argument) => argument.startsWith('ghostcommit://agent/link?')) ?? null;
}

export class GhostCommitProtocolHandler {
  private ready = false;
  private readonly queue: string[] = [];

  constructor(private readonly handleLink: ProtocolLinkHandler) {}

  receive(linkUrl: string): void {
    if (!linkUrl.startsWith('ghostcommit://agent/link?')) {
      return;
    }

    if (!this.ready) {
      this.queue.push(linkUrl);
      return;
    }

    void this.handleLink(linkUrl);
  }

  async markReady(): Promise<void> {
    this.ready = true;
    while (this.queue.length > 0) {
      const linkUrl = this.queue.shift();
      if (linkUrl) {
        await this.handleLink(linkUrl);
      }
    }
  }
}
