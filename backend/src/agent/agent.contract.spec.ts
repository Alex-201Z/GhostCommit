import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { AgentController } from './agent.controller';
import { AgentLinkRequestDto, AgentLinkConfirmDto } from './dto/agent-link.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

describe('Agent phase 3 contract', () => {
  it('exposes the authenticated agent linking and revocation routes', () => {
    const prototype = AgentController.prototype as unknown as Record<string, unknown>;

    expect(Reflect.getMetadata(PATH_METADATA, prototype.createLinkRequest as object)).toBe('link-request');
    expect(Reflect.getMetadata(METHOD_METADATA, prototype.createLinkRequest as object)).toBe(RequestMethod.POST);

    expect(Reflect.getMetadata(PATH_METADATA, prototype.confirmLink as object)).toBe('link/confirm');
    expect(Reflect.getMetadata(METHOD_METADATA, prototype.confirmLink as object)).toBe(RequestMethod.POST);

    expect(Reflect.getMetadata(PATH_METADATA, prototype.installations as object)).toBe('installations');
    expect(Reflect.getMetadata(METHOD_METADATA, prototype.installations as object)).toBe(RequestMethod.GET);

    expect(Reflect.getMetadata(PATH_METADATA, prototype.revoke as object)).toBe('installations/:id/revoke');
    expect(Reflect.getMetadata(METHOD_METADATA, prototype.revoke as object)).toBe(RequestMethod.POST);
  });

  it('allows only non-identifying agent link metadata', async () => {
    const dto = plainToInstance(AgentLinkRequestDto, {
      deviceLabel: 'Windows dev laptop',
      osFamily: 'windows',
      agentVersion: '0.1.0',
      hostname: 'must-not-be-accepted',
      machineId: 'must-not-be-accepted',
    });

    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });

    expect(errors.map((error) => error.property)).toEqual(expect.arrayContaining(['hostname', 'machineId']));
  });

  it('requires a short-lived link code before confirming an agent installation', async () => {
    const dto = plainToInstance(AgentLinkConfirmDto, {
      deviceLabel: 'Windows dev laptop',
      osFamily: 'windows',
      agentVersion: '0.1.0',
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toContain('linkCode');
  });
});
