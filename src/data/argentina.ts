export interface Province {
  id: string;
  name: string;
  cities: City[];
}

export interface City {
  id: string;
  name: string;
  neighborhoods: string[];
}

export const ARGENTINA_DATA: Province[] = [
  {
    id: 'caba',
    name: 'Ciudad Autónoma de Buenos Aires',
    cities: [
      {
        id: 'caba-city',
        name: 'Ciudad Autónoma de Buenos Aires',
        neighborhoods: [
          'Palermo', 'Recoleta', 'Belgrano', 'Núñez', 'Barrio Norte', 'Villa Crespo',
          'Caballito', 'Flores', 'Once', 'Balvanera', 'San Telmo', 'La Boca',
          'Puerto Madero', 'Retiro', 'Microcentro', 'Congreso', 'Monserrat',
          'Villa Urquiza', 'Villa Pueyrredón', 'Coghlan', 'Saavedra', 'Villa Devoto',
          'Villa del Parque', 'Agronomía', 'Chacarita', 'Colegiales', 'Villa Ortúzar',
          'Paternal', 'Villa Santa Rita', 'Villa Mitre', 'Floresta', 'Vélez Sársfield',
          'Liniers', 'Villa Luro', 'Versalles', 'Villa Real', 'Monte Castro',
          'Parque Avellaneda', 'Parque Chacabuco', 'Boedo', 'Almagro', 'Abasto'
        ]
      }
    ]
  },
  {
    id: 'buenos-aires',
    name: 'Buenos Aires',
    cities: [
      {
        id: 'la-plata',
        name: 'La Plata',
        neighborhoods: ['Centro', 'Gonnet', 'City Bell', 'Villa Elisa', 'Tolosa', 'Los Hornos', 'Ringuelet']
      },
      {
        id: 'mar-del-plata',
        name: 'Mar del Plata',
        neighborhoods: ['Centro', 'Güemes', 'La Perla', 'Playa Grande', 'Constitución', 'Puerto', 'Punta Mogotes']
      },
      {
        id: 'bahia-blanca',
        name: 'Bahía Blanca',
        neighborhoods: ['Centro', 'Villa Mitre', 'Palihue', 'Noroeste', 'Villa Rosas', 'Cerri']
      },
      {
        id: 'tandil',
        name: 'Tandil',
        neighborhoods: ['Centro', 'Villa Italia', 'Cerro Leones', 'Villa Cordobita', 'Barrio Paraíso']
      },
      {
        id: 'san-nicolas',
        name: 'San Nicolás',
        neighborhoods: ['Centro', 'Villa Constitución', 'Barrio Norte', 'San Lorenzo']
      }
    ]
  },
  {
    id: 'cordoba',
    name: 'Córdoba',
    cities: [
      {
        id: 'cordoba-capital',
        name: 'Córdoba',
        neighborhoods: [
          'Centro', 'Nueva Córdoba', 'Güemes', 'General Paz', 'Alberdi', 'Alta Córdoba',
          'Cerro de las Rosas', 'Villa Carlos Paz', 'Barrio Jardín', 'Cofico', 'San Vicente'
        ]
      },
      {
        id: 'villa-carlos-paz',
        name: 'Villa Carlos Paz',
        neighborhoods: ['Centro', 'Costa Azul', 'Villa del Lago', 'Los Alpes', 'San Roque']
      },
      {
        id: 'rio-cuarto',
        name: 'Río Cuarto',
        neighborhoods: ['Centro', 'Banda Norte', 'Alberdi', 'Santa Catalina', 'Pueblo Nuevo']
      }
    ]
  },
  {
    id: 'santa-fe',
    name: 'Santa Fe',
    cities: [
      {
        id: 'rosario',
        name: 'Rosario',
        neighborhoods: ['Centro', 'Pichincha', 'Echesortu', 'Fisherton', 'Pellegrini', 'Barrio Norte', 'Zona Sur']
      },
      {
        id: 'santa-fe-capital',
        name: 'Santa Fe',
        neighborhoods: ['Centro', 'Candioti', 'Guadalupe', 'Barranquitas', 'San José', 'Villa Setúbal']
      }
    ]
  },
  {
    id: 'mendoza',
    name: 'Mendoza',
    cities: [
      {
        id: 'mendoza-capital',
        name: 'Mendoza',
        neighborhoods: ['Centro', 'Quinta Sección', 'Sexta Sección', 'Parque Central', 'Pedro Molina', 'Belgrano']
      },
      {
        id: 'san-rafael',
        name: 'San Rafael',
        neighborhoods: ['Centro', 'Villa 25 de Mayo', 'Barrio Cooperativa', 'San Rafael Sur']
      },
      {
        id: 'godoy-cruz',
        name: 'Godoy Cruz',
        neighborhoods: ['Centro', 'Gobernador Benegas', 'Villa Hipódromo', 'Piedras Blancas']
      }
    ]
  },
  {
    id: 'tucuman',
    name: 'Tucumán',
    cities: [
      {
        id: 'san-miguel-tucuman',
        name: 'San Miguel de Tucumán',
        neighborhoods: ['Centro', 'Barrio Norte', 'Villa 9 de Julio', 'Quinta Sección', 'Villa Luján', 'Yerba Buena']
      },
      {
        id: 'tafi-viejo',
        name: 'Tafí Viejo',
        neighborhoods: ['Centro', 'Villa Carmela', 'Los Naranjos', 'El Cadillal']
      }
    ]
  },
  {
    id: 'salta',
    name: 'Salta',
    cities: [
      {
        id: 'salta-capital',
        name: 'Salta',
        neighborhoods: ['Centro', 'Villa San Lorenzo', 'Grand Bourg', 'Tres Cerritos', 'Villa Las Rosas', 'Norte Grande']
      },
      {
        id: 'san-ramon',
        name: 'San Ramón de la Nueva Orán',
        neighborhoods: ['Centro', 'Villa Matilde', 'Barrio Norte', 'Hipódromo']
      }
    ]
  },
  {
    id: 'entre-rios',
    name: 'Entre Ríos',
    cities: [
      {
        id: 'parana',
        name: 'Paraná',
        neighborhoods: ['Centro', 'Bajada Grande', 'Villa Urquiza', 'Barrio Belgrano', 'Don Bosco']
      },
      {
        id: 'concordia',
        name: 'Concordia',
        neighborhoods: ['Centro', 'Barrio Norte', 'Villa Zorraquín', 'Puerto']
      }
    ]
  },
  {
    id: 'misiones',
    name: 'Misiones',
    cities: [
      {
        id: 'posadas',
        name: 'Posadas',
        neighborhoods: ['Centro', 'Villa Cabello', 'Miguel Lanús', 'Itaembé Guazú', 'Villa Sarita']
      },
      {
        id: 'puerto-iguazu',
        name: 'Puerto Iguazú',
        neighborhoods: ['Centro', 'Barrio Norte', 'Villa Aguirre', 'Puerto Franco']
      }
    ]
  },
  {
    id: 'neuquen',
    name: 'Neuquén',
    cities: [
      {
        id: 'neuquen-capital',
        name: 'Neuquén',
        neighborhoods: ['Centro', 'Villa Farrell', 'Sapere', 'Confluencia', 'Villa María', 'Barrio Nuevo']
      },
      {
        id: 'san-martin-andes',
        name: 'San Martín de los Andes',
        neighborhoods: ['Centro', 'Chapelco', 'Barrio Norte', 'Villa Meliquina']
      }
    ]
  }
];