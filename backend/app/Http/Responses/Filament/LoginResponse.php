<?php

namespace App\Http\Responses\Filament;

use Filament\Http\Responses\Auth\Contracts\LoginResponse as LoginResponseContract;
use Illuminate\Http\RedirectResponse;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request): RedirectResponse
    {
        return redirect('/admin/mis-rutinas-hoy');
    }
}
