import OAuth from "oauth-1.0a";
import crypto from "crypto-js";

export interface DiscogsOAuthConfig {
  consumerKey: string;
  consumerSecret: string;
  callbackUrl: string;
}

export interface RequestTokenData {
  oauth_token: string;
  oauth_token_secret: string;
  oauth_callback_confirmed: string;
}

export interface AccessTokenData {
  oauth_token: string;
  oauth_token_secret: string;
}

export class DiscogsOAuth {
  private oauth: OAuth;
  private config: DiscogsOAuthConfig;

  constructor(config: DiscogsOAuthConfig) {
    this.config = config;
    this.oauth = new OAuth({
      consumer: {
        key: config.consumerKey,
        secret: config.consumerSecret,
      },
      signature_method: "HMAC-SHA1",
      hash_function(base_string, key) {
        return crypto.HmacSHA1(base_string, key).toString(crypto.enc.Base64);
      },
    });
  }

  // Step 1: Get request token
  async getRequestToken(): Promise<RequestTokenData> {
    const requestData = {
      url: "https://api.discogs.com/oauth/request_token",
      method: "GET",
      data: {
        oauth_callback: this.config.callbackUrl,
      },
    };

    const authHeader = this.oauth.toHeader(this.oauth.authorize(requestData));

    const response = await fetch(requestData.url, {
      method: requestData.method,
      headers: {
        ...authHeader,
        "User-Agent": "VinylCollectionApp/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get request token: ${response.statusText}`);
    }

    const responseText = await response.text();
    const params = new URLSearchParams(responseText);

    return {
      oauth_token: params.get("oauth_token") || "",
      oauth_token_secret: params.get("oauth_token_secret") || "",
      oauth_callback_confirmed: params.get("oauth_callback_confirmed") || "",
    };
  }

  // Step 2: Get authorization URL
  getAuthorizationUrl(requestToken: string): string {
    return `https://discogs.com/oauth/authorize?oauth_token=${requestToken}`;
  }

  // Step 3: Exchange for access token
  async getAccessToken(
    requestToken: string,
    requestTokenSecret: string,
    verifier: string
  ): Promise<AccessTokenData> {
    const requestData = {
      url: "https://api.discogs.com/oauth/access_token",
      method: "POST",
      data: {
        oauth_verifier: verifier,
      },
    };

    const token = {
      key: requestToken,
      secret: requestTokenSecret,
    };

    const authHeader = this.oauth.toHeader(
      this.oauth.authorize(requestData, token)
    );

    const response = await fetch(requestData.url, {
      method: requestData.method,
      headers: {
        ...authHeader,
        "User-Agent": "VinylCollectionApp/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.statusText}`);
    }

    const responseText = await response.text();
    const params = new URLSearchParams(responseText);

    return {
      oauth_token: params.get("oauth_token") || "",
      oauth_token_secret: params.get("oauth_token_secret") || "",
    };
  }

  // Make authenticated API calls
  async makeAuthenticatedRequest(
    url: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    accessToken: string,
    accessTokenSecret: string,
    data?: any
  ): Promise<Response> {
    const requestData = {
      url,
      method,
      data,
    };

    const token = {
      key: accessToken,
      secret: accessTokenSecret,
    };

    const authHeader = this.oauth.toHeader(
      this.oauth.authorize(requestData, token)
    );

    return fetch(url, {
      method,
      headers: {
        ...authHeader,
        "User-Agent": "VinylCollectionApp/1.0",
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// Helper function to create OAuth instance
export function createDiscogsOAuth(): DiscogsOAuth {
  const consumerKey = process.env.DISCOGS_CLIENT_KEY;
  const consumerSecret = process.env.DISCOGS_CLIENT_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!consumerKey || !consumerSecret) {
    throw new Error("Missing Discogs OAuth credentials");
  }

  return new DiscogsOAuth({
    consumerKey,
    consumerSecret,
    callbackUrl: `${baseUrl}/api/auth/discogs/callback`,
  });
}
