<?php

namespace App\Models;

class Auto extends BaseModel
{
    protected $table = 'autos';

    protected $primaryKey = 'ID';

    public function tipo()
    {
        return $this->belongsTo(Tipo::class, 'ID_Tipos', 'ID_Tipos');
    }

    public function reservas()
    {
        return $this->hasMany(Reserva::class, 'ID_Auto', 'ID');
    }

    public function sucursales()
    {
        return $this->belongsToMany(Sucursal::class, 'autos_sucursales', 'ID_Auto', 'ID_Sucursal');
    }
}
