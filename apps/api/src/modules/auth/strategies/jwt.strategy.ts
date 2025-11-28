/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import {
  Strategy,
  type JwtFromRequestFunction,
  type StrategyOptionsWithoutRequest
} from 'passport-jwt';
import type { Request } from 'express';

import { AuthService } from '../auth.service';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService, private readonly authService: AuthService) {
    const jwtFromRequest: JwtFromRequestFunction = (request: Request) => {
      const authorization = request.headers.authorization;
      if (!authorization) {
        return null;
      }
      const [scheme, token] = authorization.split(' ');
      if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
        return null;
      }
      return token;
    };

    const strategyOptions: StrategyOptionsWithoutRequest = {
      jwtFromRequest,
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? 'change-me'
    };

    super(strategyOptions);
  }

  validate(payload: JwtPayload): AuthUser {
    return this.authService.buildAuthUser(payload);
  }
}

/* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */

