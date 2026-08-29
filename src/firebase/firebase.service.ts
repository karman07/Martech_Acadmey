import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  applicationDefault,
  getApp,
  getApps,
  initializeApp,
  type App,
} from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private app: App;

  onModuleInit() {
    this.app = getApps().length
      ? getApp()
      : initializeApp({ credential: applicationDefault() });
  }

  auth() {
    return getAuth(this.app);
  }
}
