import { Controller, Get, Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';

// Guards the test toolchain: NestJS resolves constructor dependencies from the
// `design:paramtypes` metadata, which only exists if the Vitest transformer emits decorator
// metadata like `tsc` does (review 2026-11-08, minor 7).

@Injectable()
class GreetingService {
  greet(): string {
    return 'hola';
  }
}

@Controller('greeting')
class GreetingController {
  constructor(private readonly greetingService: GreetingService) {}

  @Get()
  get(): string {
    return this.greetingService.greet();
  }
}

@Module({ controllers: [GreetingController], providers: [GreetingService] })
class GreetingModule {}

describe('constructor injection under Vitest', () => {
  it('emits design:paramtypes for an injected constructor parameter', () => {
    expect(Reflect.getMetadata('design:paramtypes', GreetingController)).toEqual([GreetingService]);
  });

  it('resolves a provider injected through the constructor', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [GreetingModule] }).compile();

    expect(moduleRef.get(GreetingController).get()).toBe('hola');

    await moduleRef.close();
  });
});
