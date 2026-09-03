<?php

namespace App\Models;

class Estado extends BaseModel
{
    protected $table = 'estados';

    protected $primaryKey = 'ID';

    public function reservas()
    {
        return $this->hasMany(Reserva::class, 'ID_Estado', 'ID');
    }
}
