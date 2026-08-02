<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'username' => ['nullable', 'string', 'max:255'],
            'nombre' => ['nullable', 'string', 'max:255'],
            'perfil' => ['nullable', 'string'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'device_name' => ['nullable', 'string', 'max:255'],
        ]);

        $user = User::create([
            'username' => $data['username'] ?? $data['nombre'] ?? null,
            'perfil' => $data['perfil'] ?? null,
            'email' => $data['email'],
            'password' => $data['password'],
        ]);

        $token = $user->createToken($data['device_name'] ?? 'apk')->plainTextToken;

        return response()->json([
            'message' => 'Usuario registrado correctamente.',
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $this->userPayload($user),
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:255'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales son incorrectas.'],
            ]);
        }

        $token = $user->createToken($data['device_name'] ?? 'apk')->plainTextToken;

        return response()->json([
            'message' => 'Login exitoso.',
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $this->userPayload($user),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $this->userPayload($request->user()),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Sesion cerrada correctamente.',
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $data = $request->validate([
            'username' => ['required', 'string', 'max:255'],
            'perfil' => ['nullable', 'image', 'max:5120'],
            'remove_profile_photo' => ['nullable', 'boolean'],
        ]);

        /** @var User $user */
        $user = $request->user();
        $user->username = $data['username'];

        $shouldRemovePhoto = (bool) ($data['remove_profile_photo'] ?? false);

        if ($shouldRemovePhoto && filled($user->perfil)) {
            $this->deleteStoredProfilePhoto($user->perfil);
            $user->perfil = null;
        }

        if ($request->hasFile('perfil')) {
            if (filled($user->perfil)) {
                $this->deleteStoredProfilePhoto($user->perfil);
            }

            $user->perfil = $request->file('perfil')->store("profiles/{$user->id}", 'public');
        }

        $user->save();

        return response()->json([
            'message' => 'Perfil actualizado correctamente.',
            'user' => $this->userPayload($user->fresh()),
        ]);
    }

    /**
     * @return array{id:int,username:string,perfil:?string,email:string,created_at:?string,updated_at:?string}
     */
    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'username' => $user->username,
            'perfil' => $this->profileUrl($user->perfil),
            'email' => $user->email,
            'created_at' => $user->created_at?->toISOString(),
            'updated_at' => $user->updated_at?->toISOString(),
        ];
    }

    private function profileUrl(?string $path): ?string
    {
        if (blank($path)) {
            return null;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        if (str_starts_with($path, '/storage/')) {
            return $this->resolvePublicBaseUrl() . $path;
        }

        return $this->resolvePublicBaseUrl() . '/storage/' . ltrim($path, '/');
    }

    private function resolvePublicBaseUrl(): string
    {
        $configuredAppUrl = rtrim((string) config('app.url'), '/');

        if ($configuredAppUrl !== '' && ! str_contains($configuredAppUrl, 'localhost')) {
            return $configuredAppUrl;
        }

        $requestHost = request()->getHost();
        $requestScheme = request()->isSecure() ? 'https' : request()->getScheme();

        if ($requestHost && ! in_array($requestHost, ['localhost', '127.0.0.1'], true)) {
            return $requestScheme . '://' . $requestHost;
        }

        return rtrim(request()->getSchemeAndHttpHost(), '/');
    }

    private function deleteStoredProfilePhoto(string $path): void
    {
        if (
            str_starts_with($path, 'http://')
            || str_starts_with($path, 'https://')
            || str_starts_with($path, '/storage/')
        ) {
            return;
        }

        Storage::disk('public')->delete($path);
    }
}
