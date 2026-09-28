import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseAdminService {
  private readonly logger = new Logger(FirebaseAdminService.name);
  private firebaseApp: admin.app.App;

  constructor(private readonly configService: ConfigService) {
    const projectId = this.configService.getOrThrow<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.getOrThrow<string>('FIREBASE_CLIENT_EMAIL');
    const rawPrivateKey = this.configService.getOrThrow<string>('FIREBASE_PRIVATE_KEY');
    const privateKey = rawPrivateKey.replace(/\\n/g, '\n');

    if (!admin.apps.length) {
      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      });
      this.logger.log(`Firebase Admin initialized: ${projectId}`);
    } else {
      this.firebaseApp = admin.app();
    }
  }

  get auth(): admin.auth.Auth {
    return this.firebaseApp.auth();
  }

  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    return this.auth.verifyIdToken(idToken, true);
  }
}
