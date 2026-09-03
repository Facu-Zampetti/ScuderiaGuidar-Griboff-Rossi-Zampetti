<?php

namespace App\Models;

class Cliente extends BaseModel
{
    protected $table = 'clientes';

    protected $primaryKey = 'ID';

    protected $hidden = ['Contraseña'];

    public function reservas()
    {
        return $this->hasMany(Reserva::class, 'ID_Cliente', 'ID');
    }
}
