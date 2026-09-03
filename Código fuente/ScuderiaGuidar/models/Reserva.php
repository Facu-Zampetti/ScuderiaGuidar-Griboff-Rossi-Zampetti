<?php

namespace App\Models;

class Reserva extends BaseModel
{
    protected $table = 'reservas';

    protected $primaryKey = 'ID';

    public function auto()
    {
        return $this->belongsTo(Auto::class, 'ID_Auto', 'ID');
    }

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'ID_Cliente', 'ID');
    }

    public function estado()
    {
        return $this->belongsTo(Estado::class, 'ID_Estado', 'ID');
    }

    public function sucursalRetiro()
    {
        return $this->belongsTo(Sucursal::class, 'ID_Sucursal_Retiro', 'ID');
    }

    public function sucursalDevolucion()
    {
        return $this->belongsTo(Sucursal::class, 'ID_Sucursal_Devolucion', 'ID');
    }
}
