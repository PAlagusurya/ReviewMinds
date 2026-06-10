import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrsController } from './prs.controller';
import { PrsService } from './prs.service';
import { PullRequest } from '../db/entities/pull-request.entity';
import { Analysis } from '../db/entities/analysis.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PullRequest, Analysis])],
  controllers: [PrsController],
  providers: [PrsService],
})
export class PrsModule {}
