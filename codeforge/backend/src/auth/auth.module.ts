import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GithubStrategy } from './github.strategy';

/**
imports     →  other MODULES you need
controllers →  classes that handle ROUTES
providers   →  classes marked with @Injectable() 
imports     →  modules that SET THINGS UP
controllers →  classes that RECEIVE requests
providers   →  classes that DO the work
*/

@Module({
  imports: [PassportModule.register({ session: true })],
  controllers: [AuthController],
  providers: [AuthService, GithubStrategy],
})
export class AuthModule {}
