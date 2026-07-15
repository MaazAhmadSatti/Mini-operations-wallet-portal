import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getRoot(): { message: string } {
    return { message: 'Mini Operations Wallet Portal API' };
  }
}
