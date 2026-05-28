import { InjectQueue } from '@nestjs/bullmq';
import { Controller, Get } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUES } from 'src/bull/constants';

/** Decorator is a special annotation using `@` that adds metadata or special behavior to classes/methods.
Frameworks like NestJS use decorators to automatically understand routes, services, modules, etc. */

/*
- @Controller() → marks class as route controller
- @Get() → handles GET request
- Decorators add metadata for NestJS to know how to route requests to this controller and method.
*/

/*A class in TypeScript creates BOTH:
- runtime class/constructor
- compile-time type

Example:
class User {}

Runtime:
new User()

Type:
let user: User

Same class name is used as:
- actual class at runtime
- type during development */

@Controller('health')
export class HealthController {
  constructor(@InjectQueue(QUEUES.ANALYZE_PR) private readonly queue: Queue) {}

  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'backend',
    };
  }

  @Get('test-queue')
  async testQueue() {
    await this.queue.add(QUEUES.ANALYZE_PR, {
      prNumber: 111,
      repoFullName: 'Asurya/repo',
      headSha: 'abc123',
    });

    return { message: 'Job added to queue' };
  }
}
