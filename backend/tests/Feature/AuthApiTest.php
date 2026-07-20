<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_from_api(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'nombre' => 'Nicko',
            'email' => 'nicko@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'device_name' => 'apk-test',
        ]);

        $response
            ->assertCreated()
            ->assertJsonStructure([
                'message',
                'token',
                'token_type',
                'user' => ['id', 'nombre', 'email', 'created_at', 'updated_at'],
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'nicko@example.com',
            'nombre' => 'Nicko',
        ]);
    }

    public function test_user_can_login_and_fetch_profile(): void
    {
        $user = User::factory()->create([
            'nombre' => 'Nicko',
            'email' => 'nicko@example.com',
            'password' => 'password123',
        ]);

        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
            'device_name' => 'apk-test',
        ]);

        $token = $loginResponse->json('token');

        $loginResponse
            ->assertOk()
            ->assertJsonPath('user.email', $user->email);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('user.email', $user->email);
    }

    public function test_user_can_logout_current_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('apk-test')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/auth/logout')
            ->assertOk()
            ->assertJsonPath('message', 'Sesion cerrada correctamente.');

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }
}
