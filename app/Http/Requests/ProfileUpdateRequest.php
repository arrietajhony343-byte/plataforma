<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($this->user()->id),
            ],
            'tipo_documento' => ['nullable', 'in:CC,TI,CE,RC,PP'],
            'documento' => [
                'nullable',
                'regex:/^[0-9]{5,15}$/',
                Rule::unique('users', 'documento')->ignore($this->user()->id),
            ],
            'telefono' => ['nullable', 'regex:/^[0-9]{7,10}$/'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'fecha_nacimiento' => ['nullable', 'date', 'before_or_equal:today'],
            'lugar_nacimiento' => ['nullable', 'string', 'max:255'],
            'genero' => ['nullable', 'in:M,F,otro'],
            'grupo_sanguineo' => ['nullable', 'string', 'max:5'],
            'eps' => ['nullable', 'string', 'max:255'],
            'foto' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ];
    }
}
