<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->to(url('/admin/mis-rutinas-hoy'));
    }

    return redirect()->to(url('/admin/login'));
});
