import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

/*

- HealthController = class/type
- controller variable stores instance/object of class

- TestingModule = temporary NestJS app for testing
- beforeEach() creates fresh setup before every test

- module.get() retrieves controller instance from NestJS DI container
*/

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should return health status', () => {
    expect(controller.getHealth()).toEqual({
      status: 'ok',
      service: 'backend',
    });
  });
});
