import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ProjectsController } from './projects.controller';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

describe('Projects phase 3 contract', () => {
  it('exposes user-owned project routes without the legacy team-id surface', () => {
    const prototype = ProjectsController.prototype as unknown as Record<string, unknown>;

    expect(Reflect.getMetadata(PATH_METADATA, prototype.create as object)).toBe('/');
    expect(Reflect.getMetadata(METHOD_METADATA, prototype.create as object)).toBe(RequestMethod.POST);

    expect(Reflect.getMetadata(PATH_METADATA, prototype.list as object)).toBe('/');
    expect(Reflect.getMetadata(METHOD_METADATA, prototype.list as object)).toBe(RequestMethod.GET);

    expect(Reflect.getMetadata(PATH_METADATA, prototype.get as object)).toBe(':id');
    expect(Reflect.getMetadata(METHOD_METADATA, prototype.get as object)).toBe(RequestMethod.GET);

    expect(Reflect.getMetadata(PATH_METADATA, prototype.update as object)).toBe(':id');
    expect(Reflect.getMetadata(METHOD_METADATA, prototype.update as object)).toBe(RequestMethod.PATCH);

    expect(Reflect.getMetadata(PATH_METADATA, prototype.pause as object)).toBe(':id/pause');
    expect(Reflect.getMetadata(METHOD_METADATA, prototype.pause as object)).toBe(RequestMethod.POST);

    expect(Reflect.getMetadata(PATH_METADATA, prototype.resume as object)).toBe(':id/resume');
    expect(Reflect.getMetadata(METHOD_METADATA, prototype.resume as object)).toBe(RequestMethod.POST);

    expect(Reflect.getMetadata(PATH_METADATA, prototype.archive as object)).toBe(':id/archive');
    expect(Reflect.getMetadata(METHOD_METADATA, prototype.archive as object)).toBe(RequestMethod.POST);
  });

  it('rejects absolute paths and forbidden client ownership fields when creating a project', async () => {
    const dto = plainToInstance(CreateProjectDto, {
      displayName: 'GhostCommit',
      gitProvider: 'LOCAL',
      localAlias: 'C:\\Users\\dev\\secret-project',
      teamId: 'attacker-controlled-team',
      absolutePath: 'C:\\Users\\dev\\secret-project',
      isTrackingEnabled: true,
    });

    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    const fields = errors.map((error) => error.property);

    expect(fields).toEqual(expect.arrayContaining(['localAlias', 'teamId', 'absolutePath']));
  });

  it('allows privacy settings but never requires file paths in reports', async () => {
    const dto = plainToInstance(UpdateProjectDto, {
      ignoredPatterns: ['dist/**', '.env*'],
      includeFilePathsInReports: false,
      excludedFromReports: true,
    });

    await expect(validate(dto)).resolves.toEqual([]);
  });
});
