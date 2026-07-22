import Constants from 'expo-constants';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type Primitive = string | number | boolean | null;

type JsonValue = Primitive | JsonValue[] | { [key: string]: JsonValue };

export type ApiRequestBody = Record<string, JsonValue> | undefined;

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export type ApiClientOptions = {
  token?: string | null;
  headers?: Record<string, string>;
  body?: ApiRequestBody;
};

export type AuthUser = {
  id: number;
  nombre: string;
  email: string;
  created_at: string | null;
  updated_at: string | null;
};

export type AuthResponse = {
  message: string;
  token: string;
  token_type: 'Bearer';
  user: AuthUser;
};

export type RegisterPayload = {
  nombre: string;
  email: string;
  password: string;
  password_confirmation: string;
  device_name?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
  device_name?: string;
};

export type CurrentUserResponse = {
  user: AuthUser;
};

export type LogoutResponse = {
  message: string;
};

const extra = Constants.expoConfig?.extra ?? {};

const configuredApiUrl =
  process.env.EXPO_PUBLIC_API_URL ??
  (typeof extra.apiUrl === 'string' ? extra.apiUrl : undefined);

function removeTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function buildUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (!configuredApiUrl) {
    throw new Error(
      'Falta configurar la URL del backend. Defini EXPO_PUBLIC_API_URL o expo.extra.apiUrl.',
    );
  }

  return `${removeTrailingSlash(configuredApiUrl)}${normalizedPath}`;
}

async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();

  return text.length > 0 ? text : null;
}

function resolveErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  if ('message' in payload && typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message;
  }

  if ('errors' in payload && payload.errors && typeof payload.errors === 'object') {
    const firstFieldErrors = Object.values(payload.errors as Record<string, unknown>).find((value) =>
      Array.isArray(value) && value.length > 0 && typeof value[0] === 'string',
    ) as string[] | undefined;

    if (firstFieldErrors?.[0]) {
      return firstFieldErrors[0];
    }
  }

  return fallback;
}

async function request<TResponse>(
  method: HttpMethod,
  path: string,
  options: ApiClientOptions = {},
): Promise<TResponse> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...options.headers,
  };

  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(buildUrl(path), {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new ApiError(
      resolveErrorMessage(payload, `Error ${response.status} al comunicarse con el backend.`),
      response.status,
      payload,
    );
  }

  return payload as TResponse;
}

export const apiClient = {
  get<TResponse>(path: string, options?: Omit<ApiClientOptions, 'body'>) {
    return request<TResponse>('GET', path, options);
  },
  post<TResponse>(path: string, options?: ApiClientOptions) {
    return request<TResponse>('POST', path, options);
  },
  put<TResponse>(path: string, options?: ApiClientOptions) {
    return request<TResponse>('PUT', path, options);
  },
  patch<TResponse>(path: string, options?: ApiClientOptions) {
    return request<TResponse>('PATCH', path, options);
  },
  delete<TResponse>(path: string, options?: Omit<ApiClientOptions, 'body'>) {
    return request<TResponse>('DELETE', path, options);
  },
};

export const authApi = {
  register(payload: RegisterPayload) {
    return apiClient.post<AuthResponse>('/api/auth/register', { body: payload });
  },
  login(payload: LoginPayload) {
    return apiClient.post<AuthResponse>('/api/auth/login', { body: payload });
  },
  me(token: string) {
    return apiClient.get<CurrentUserResponse>('/api/auth/me', { token });
  },
  logout(token: string) {
    return apiClient.post<LogoutResponse>('/api/auth/logout', { token });
  },
};

export const apiConfig = {
  baseUrl: configuredApiUrl ?? null,
};
