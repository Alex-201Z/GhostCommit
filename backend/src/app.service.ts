import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  getInfo() {
    return {
      name: 'GhostCommit API',
      version: '0.1.0',
      description: 'Le travail que tu fais vraiment. Enfin visible.',
      documentation: '/api/docs',
    };
  }
}
