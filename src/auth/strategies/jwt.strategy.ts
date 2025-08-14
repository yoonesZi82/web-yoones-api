import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import PayloadType from '../types/payload.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req) => req?.cookies?.access_token || null,
      ]),
      ignoreExpiration: false, // for expire token
      secretOrKey: configService.get('JWT_SECRET_KEY') as string,
    });
  }

  validate(payload: PayloadType) {
    return {
      id: payload.id,
      mobile: payload.mobile,
      username: payload.username,
      email: payload.email,
    };
  }
}
