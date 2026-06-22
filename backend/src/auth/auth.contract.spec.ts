import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { AuthController } from './auth.controller';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateOnboardingDto } from '../onboarding/dto/update-onboarding.dto';

describe('AuthController phase 1A contract', () => {
  it('exposes POST /auth/github/start instead of the legacy GET endpoint', () => {
    const prototype = AuthController.prototype as unknown as Record<string, unknown>;
    const handler = prototype.startGithub as object | undefined;

    expect(handler).toBeDefined();
    expect(Reflect.getMetadata(PATH_METADATA, handler as object)).toBe('github/start');
    expect(Reflect.getMetadata(METHOD_METADATA, handler as object)).toBe(RequestMethod.POST);
  });
  it('requires both transparency acknowledgements before consent', async () => {
    const dto = plainToInstance(UpdateOnboardingDto, {
      privacyPolicyAccepted: true,
      policyVersion: '2026-06-22',
      source: 'ONBOARDING',
    });
    const fields = (await validate(dto)).map((error) => error.property);
    expect(fields).toEqual(
      expect.arrayContaining(['hasReadCollectionNotice', 'understandsDataControl']),
    );
  });
});
