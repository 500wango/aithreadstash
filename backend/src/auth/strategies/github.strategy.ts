import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';
import * as dns from 'dns';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private configService: ConfigService) {
    // Set DNS servers to use Google DNS for better resolution
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
    
    super({
      clientID: configService.get('GITHUB_CLIENT_ID'),
      clientSecret: configService.get('GITHUB_CLIENT_SECRET'),
      callbackURL: configService.get('GITHUB_CALLBACK_URL'),
      scope: ['user:email'],
      // Use github.com instead of api.github.com for OAuth endpoints
      authorizationURL: 'https://github.com/login/oauth/authorize',
      tokenURL: 'https://github.com/login/oauth/access_token',
      userProfileURL: 'https://github.com/api/v3/user',
      customHeaders: {
        'User-Agent': 'AIThreadStash-OAuth-App',
      },
    });

    // Create custom HTTPS agent with enhanced network configuration
    const customAgent = new https.Agent({
      keepAlive: true,
      keepAliveMsecs: 30000,
      timeout: 60000,
      rejectUnauthorized: false,
      maxSockets: 50,
      maxFreeSockets: 10,
      family: 4, // Force IPv4
    });

    // Override the OAuth2 instance methods to use custom agent
    const oauth2 = (this as any)._oauth2;
    if (oauth2) {
      // Set custom agent
      oauth2.setAgent(customAgent);
      
      // Override the _request method to add better error handling
      const originalRequest = oauth2._request.bind(oauth2);
      oauth2._request = function(method: string, url: string, headers: any, post_body: any, access_token: any, callback: any) {
        // Add custom headers for better compatibility
        headers = headers || {};
        headers['User-Agent'] = 'AIThreadStash-OAuth-App';
        headers['Accept'] = 'application/json';
        
        return originalRequest(method, url, headers, post_body, access_token, callback);
      };
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any, info?: any) => void,
  ): Promise<any> {
    const { username, emails, photos } = profile;
    const user = {
      id: profile.id,
      email: emails[0].value,
      username,
      avatar: photos[0].value,
      accessToken,
    };
    
    done(null, user);
  }
}