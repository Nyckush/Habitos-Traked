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
  username: string;
  perfil: string | null;
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
  username: string;
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

export type RemoteHabit = {
  id: number;
  user_id: number;
  nombre: string;
  created_at: string | null;
  updated_at: string | null;
};

export type HabitsListResponse = {
  data: RemoteHabit[];
};

export type HabitResponse = {
  message: string;
  data: RemoteHabit;
};

export type RemoteRoutine = {
  id: number;
  user_id: number;
  nombre: string;
  dias: string[];
  created_at: string | null;
  updated_at: string | null;
};

export type RoutinesListResponse = {
  data: RemoteRoutine[];
};

export type RoutineResponse = {
  message: string;
  data: RemoteRoutine;
};

export type RemoteRoutineHabitLink = {
  id: number;
  rutina_id: number;
  habito_id: number;
  hora_inicio: string | null;
};

export type RoutineHabitLinksListResponse = {
  data: RemoteRoutineHabitLink[];
};

export type RoutineHabitLinkResponse = {
  message: string;
  data: RemoteRoutineHabitLink;
};

export type RemoteHabitRecord = {
  id: number;
  habito_id: number;
  fecha: string;
  completado: boolean;
  observacion: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type HabitRecordsListResponse = {
  data: RemoteHabitRecord[];
};

export type HabitRecordResponse = {
  message: string;
  data: RemoteHabitRecord;
};

export type RemoteTask = {
  id: number;
  user_id: number;
  titulo: string;
  hora_inicio: string | null;
  estado: 'pendiente' | 'completada';
  completed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
};

export type TasksListResponse = {
  data: RemoteTask[];
};

export type TaskResponse = {
  message: string;
  data: RemoteTask;
};

export type RemoteMeta = {
  id: number;
  user_id: number;
  nombre: string;
  fecha_inicio: string | null;
  estado: string;
  created_at: string | null;
  updated_at: string | null;
};

export type MetasListResponse = {
  data: RemoteMeta[];
};

export type MetaResponse = {
  message: string;
  data: RemoteMeta;
};

export type RemoteObjetivo = {
  id: number;
  user_id: number;
  meta_id: number | null;
  nombre: string;
  meta_esperada: number;
  fecha_limite: string;
  habito_ids: number[];
  meta_actual: number;
  tasa_exito: number;
  estado: string;
  created_at: string | null;
  updated_at: string | null;
};

export type ObjetivosListResponse = {
  data: RemoteObjetivo[];
};

export type ObjetivoResponse = {
  message: string;
  data: RemoteObjetivo;
};

export type RemoteObjetivoHabitoLink = {
  id: number;
  objetivo_id: number;
  habito_id: number;
};

export type ObjetivoHabitoLinksListResponse = {
  data: RemoteObjetivoHabitoLink[];
};

export type ObjetivoHabitoLinkResponse = {
  message: string;
  data: RemoteObjetivoHabitoLink;
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

function normalizeAuthUser(payload: unknown): AuthUser {
  const candidate = payload as {
    id?: unknown;
    username?: unknown;
    nombre?: unknown;
    perfil?: unknown;
    profile?: unknown;
    profile_photo_url?: unknown;
    email?: unknown;
    created_at?: unknown;
    updated_at?: unknown;
  };

  return {
    id: typeof candidate.id === 'number' ? candidate.id : Number(candidate.id ?? 0),
    username:
      typeof candidate.username === 'string' && candidate.username.trim().length > 0
        ? candidate.username
        : typeof candidate.nombre === 'string'
          ? candidate.nombre
          : '',
    perfil:
      typeof candidate.perfil === 'string'
        ? candidate.perfil
        : typeof candidate.profile === 'string'
          ? candidate.profile
          : typeof candidate.profile_photo_url === 'string'
            ? candidate.profile_photo_url
            : null,
    email: typeof candidate.email === 'string' ? candidate.email : '',
    created_at: typeof candidate.created_at === 'string' ? candidate.created_at : null,
    updated_at: typeof candidate.updated_at === 'string' ? candidate.updated_at : null,
  };
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
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse & { user: unknown }>('/api/auth/register', {
      body: {
        username: payload.username,
        nombre: payload.username,
        email: payload.email,
        password: payload.password,
        password_confirmation: payload.password_confirmation,
        device_name: payload.device_name ?? null,
      },
    });

    return {
      ...response,
      user: normalizeAuthUser(response.user),
    };
  },
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse & { user: unknown }>('/api/auth/login', { body: payload });

    return {
      ...response,
      user: normalizeAuthUser(response.user),
    };
  },
  async me(token: string): Promise<CurrentUserResponse> {
    const response = await apiClient.get<CurrentUserResponse & { user: unknown }>('/api/auth/me', { token });

    return {
      user: normalizeAuthUser(response.user),
    };
  },
  logout(token: string) {
    return apiClient.post<LogoutResponse>('/api/auth/logout', { token });
  },
};

export const habitsApi = {
  list(token: string) {
    return apiClient.get<HabitsListResponse>('/api/auth/habitos', { token });
  },
  create(token: string, payload: { nombre: string }) {
    return apiClient.post<HabitResponse>('/api/auth/habitos', {
      token,
      body: {
        nombre: payload.nombre,
      },
    });
  },
  update(token: string, habitId: number, payload: { nombre: string }) {
    return apiClient.put<HabitResponse>(`/api/auth/habitos/${habitId}`, {
      token,
      body: {
        nombre: payload.nombre,
      },
    });
  },
  delete(token: string, habitId: number) {
    return apiClient.delete<{ message: string }>(`/api/auth/habitos/${habitId}`, { token });
  },
};

export const routinesApi = {
  list(token: string) {
    return apiClient.get<RoutinesListResponse>('/api/auth/rutinas', { token });
  },
  create(token: string, payload: { nombre: string; dias: string[] }) {
    return apiClient.post<RoutineResponse>('/api/auth/rutinas', {
      token,
      body: {
        nombre: payload.nombre,
        dias: payload.dias,
      },
    });
  },
  update(token: string, routineId: number, payload: { nombre: string; dias: string[] }) {
    return apiClient.put<RoutineResponse>(`/api/auth/rutinas/${routineId}`, {
      token,
      body: {
        nombre: payload.nombre,
        dias: payload.dias,
      },
    });
  },
  delete(token: string, routineId: number) {
    return apiClient.delete<{ message: string }>(`/api/auth/rutinas/${routineId}`, { token });
  },
};

export const routineHabitLinksApi = {
  list(token: string) {
    return apiClient.get<RoutineHabitLinksListResponse>('/api/auth/rutina-habitos', { token });
  },
  create(
    token: string,
    payload: { rutina_id: number; habito_id: number; hora_inicio?: string | null },
  ) {
    return apiClient.post<RoutineHabitLinkResponse>('/api/auth/rutina-habitos', {
      token,
      body: {
        rutina_id: payload.rutina_id,
        habito_id: payload.habito_id,
        hora_inicio: payload.hora_inicio ?? null,
      },
    });
  },
  update(token: string, routineHabitLinkId: number, payload: { hora_inicio?: string | null }) {
    return apiClient.put<RoutineHabitLinkResponse>(
      `/api/auth/rutina-habitos/${routineHabitLinkId}`,
      {
        token,
        body: {
          hora_inicio: payload.hora_inicio ?? null,
        },
      },
    );
  },
  delete(token: string, routineHabitLinkId: number) {
    return apiClient.delete<{ message: string }>(
      `/api/auth/rutina-habitos/${routineHabitLinkId}`,
      { token },
    );
  },
};

export const habitRecordsApi = {
  list(token: string) {
    return apiClient.get<HabitRecordsListResponse>('/api/auth/registro-habitos', { token });
  },
  create(
    token: string,
    payload: {
      habito_id: number;
      fecha: string;
      completado: boolean;
      observacion?: string | null;
    },
  ) {
    return apiClient.post<HabitRecordResponse>('/api/auth/registro-habitos', {
      token,
      body: {
        habito_id: payload.habito_id,
        fecha: payload.fecha,
        completado: payload.completado,
        observacion: payload.observacion ?? null,
      },
    });
  },
  update(
    token: string,
    habitRecordId: number,
    payload: { completado: boolean; observacion?: string | null },
  ) {
    return apiClient.put<HabitRecordResponse>(`/api/auth/registro-habitos/${habitRecordId}`, {
      token,
      body: {
        completado: payload.completado,
        observacion: payload.observacion ?? null,
      },
    });
  },
};

export const tasksApi = {
  list(token: string) {
    return apiClient.get<TasksListResponse>('/api/auth/tareas', { token });
  },
  create(
    token: string,
    payload: {
      titulo: string;
      hora_inicio?: string | null;
      estado?: 'pendiente' | 'completada';
      completed_at?: string | null;
    },
  ) {
    return apiClient.post<TaskResponse>('/api/auth/tareas', {
      token,
      body: {
        titulo: payload.titulo,
        hora_inicio: payload.hora_inicio ?? null,
        estado: payload.estado ?? 'pendiente',
        completed_at: payload.completed_at ?? null,
      },
    });
  },
  update(
    token: string,
    taskId: number,
    payload: {
      titulo?: string;
      hora_inicio?: string | null;
      estado?: 'pendiente' | 'completada';
      completed_at?: string | null;
    },
  ) {
    return apiClient.put<TaskResponse>(`/api/auth/tareas/${taskId}`, {
      token,
      body: {
        ...(payload.titulo !== undefined ? { titulo: payload.titulo } : {}),
        ...(payload.hora_inicio !== undefined ? { hora_inicio: payload.hora_inicio } : {}),
        ...(payload.estado !== undefined ? { estado: payload.estado } : {}),
        ...(payload.completed_at !== undefined ? { completed_at: payload.completed_at } : {}),
      },
    });
  },
  delete(token: string, taskId: number) {
    return apiClient.delete<{ message: string }>(`/api/auth/tareas/${taskId}`, { token });
  },
};

export const metasApi = {
  list(token: string) {
    return apiClient.get<MetasListResponse>('/api/auth/metas', { token });
  },
  create(token: string, payload: { nombre: string; fecha_inicio: string }) {
    return apiClient.post<MetaResponse>('/api/auth/metas', {
      token,
      body: {
        nombre: payload.nombre,
        fecha_inicio: payload.fecha_inicio,
      },
    });
  },
  update(token: string, metaId: number, payload: { nombre: string; fecha_inicio: string }) {
    return apiClient.put<MetaResponse>(`/api/auth/metas/${metaId}`, {
      token,
      body: {
        nombre: payload.nombre,
        fecha_inicio: payload.fecha_inicio,
      },
    });
  },
  delete(token: string, metaId: number) {
    return apiClient.delete<{ message: string }>(`/api/auth/metas/${metaId}`, { token });
  },
};

export const objetivosApi = {
  list(token: string) {
    return apiClient.get<ObjetivosListResponse>('/api/auth/objetivos', { token });
  },
  create(
    token: string,
    payload: {
      meta_id?: number | null;
      nombre: string;
      meta_esperada: number;
      fecha_limite: string;
      habito_ids: number[];
    },
  ) {
    return apiClient.post<ObjetivoResponse>('/api/auth/objetivos', {
      token,
      body: {
        meta_id: payload.meta_id ?? null,
        nombre: payload.nombre,
        meta_esperada: payload.meta_esperada,
        fecha_limite: payload.fecha_limite,
        habito_ids: payload.habito_ids,
      },
    });
  },
  update(
    token: string,
    objetivoId: number,
    payload: {
      meta_id?: number | null;
      nombre: string;
      meta_esperada: number;
      fecha_limite: string;
      habito_ids: number[];
    },
  ) {
    return apiClient.put<ObjetivoResponse>(`/api/auth/objetivos/${objetivoId}`, {
      token,
      body: {
        meta_id: payload.meta_id ?? null,
        nombre: payload.nombre,
        meta_esperada: payload.meta_esperada,
        fecha_limite: payload.fecha_limite,
        habito_ids: payload.habito_ids,
      },
    });
  },
  delete(token: string, objetivoId: number) {
    return apiClient.delete<{ message: string }>(`/api/auth/objetivos/${objetivoId}`, { token });
  },
};

export const objetivoHabitoLinksApi = {
  list(token: string) {
    return apiClient.get<ObjetivoHabitoLinksListResponse>('/api/auth/objetivo-habitos', {
      token,
    });
  },
  create(token: string, payload: { objetivo_id: number; habito_id: number }) {
    return apiClient.post<ObjetivoHabitoLinkResponse>('/api/auth/objetivo-habitos', {
      token,
      body: {
        objetivo_id: payload.objetivo_id,
        habito_id: payload.habito_id,
      },
    });
  },
  delete(token: string, objetivoHabitoId: number) {
    return apiClient.delete<{ message: string }>(
      `/api/auth/objetivo-habitos/${objetivoHabitoId}`,
      { token },
    );
  },
};

export const apiConfig = {
  baseUrl: configuredApiUrl ?? null,
};
