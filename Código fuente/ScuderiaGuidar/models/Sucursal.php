<?php

namespace App\Models;

class Sucursal extends BaseModel
{
    protected $table = 'sucursales';

    protected $primaryKey = 'ID';

    public function autos()
    {
        return $this->belongsToMany(Auto::class, 'autos_sucursales', 'ID_Sucursal', 'ID_Auto');
    }

    public function reservasRetiro()
    {
        return $this->hasMany(Reserva::class, 'ID_Sucursal_Retiro', 'ID');
    }

    public function reservasDevolucion()
    {
        return $this->hasMany(Reserva::class, 'ID_Sucursal_Devolucion', 'ID');
    }
}
