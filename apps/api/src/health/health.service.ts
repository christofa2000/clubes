import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  getStatus(): { ok: boolean } {
    return { ok: true };
  }
}

