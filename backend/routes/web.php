<?php

use Filament\Facades\Filament;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->to(Filament::getPanel('admin')->getUrl());
    }

    return view('welcome');
});
