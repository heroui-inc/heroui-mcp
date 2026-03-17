export interface AuthWorkerSuccessResponse {
  success: true;
  data: {
    userId: string;
    apiKeyId: string;
    user: {
      id: string;
      createdAt: number;
    };
    apiKey: {
      id: string;
      name: string;
      status: "active";
      createdAt: number;
      lastUsedAt?: number;
      expiresAt?: number | null;
    };
  };
}

export interface AuthWorkerErrorResponse {
  success: false;
  error: {
    code:
      | "UNAUTHORIZED"
      | "FORBIDDEN"
      | "INVALID_KEY"
      | "KEY_EXPIRED"
      | "KEY_REVOKED"
      | "USER_NOT_FOUND"
      | "INTERNAL_ERROR";
    message: string;
  };
}

export type AuthWorkerResponse = AuthWorkerSuccessResponse | AuthWorkerErrorResponse;
