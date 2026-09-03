<?php

namespace App\Models;

class Tipo extends BaseModel
{
    protected $table = 'tipos';

    protected $primaryKey = 'ID_Tipos';

    public function autos()
    {
        return $this->hasMany(Auto::class, 'ID_Tipos', 'ID_Tipos');
    }
}
