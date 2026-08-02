<?php

namespace App\Filament\Pages\Auth;

use Filament\Auth\Pages\EditProfile as BaseEditProfile;
use Filament\Forms\Components\FileUpload;
use Filament\Schemas\Components\Component;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class EditProfile extends BaseEditProfile
{
    protected function getNameFormComponent(): Component
    {
        return parent::getNameFormComponent()
            ->label('Username');
    }

    protected function getProfilePhotoFormComponent(): Component
    {
        return FileUpload::make('perfil')
            ->label('Foto de perfil')
            ->avatar()
            ->alignCenter()
            ->disk('public')
            ->directory(fn (): string => 'profiles/' . $this->getUser()->getKey())
            ->visibility('public')
            ->image()
            ->imageEditor()
            ->nullable();
    }

    public function form(\Filament\Schemas\Schema $schema): \Filament\Schemas\Schema
    {
        return $schema
            ->components([
                $this->getProfilePhotoFormComponent(),
                $this->getNameFormComponent(),
                $this->getEmailFormComponent(),
                $this->getPasswordFormComponent(),
                $this->getPasswordConfirmationFormComponent(),
                $this->getCurrentPasswordFormComponent(),
            ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    protected function handleRecordUpdate(Model $record, array $data): Model
    {
        $previousProfilePath = $record->getAttributeValue('perfil');

        $updatedRecord = parent::handleRecordUpdate($record, $data);

        $nextProfilePath = $updatedRecord->getAttributeValue('perfil');

        if (
            filled($previousProfilePath) &&
            $previousProfilePath !== $nextProfilePath &&
            ! str_starts_with($previousProfilePath, 'http://') &&
            ! str_starts_with($previousProfilePath, 'https://') &&
            ! str_starts_with($previousProfilePath, '/storage/')
        ) {
            Storage::disk('public')->delete($previousProfilePath);
        }

        return $updatedRecord;
    }
}
