export interface Village {
  id: string;
  name: string;
  location: string;
  color: string;
  accent: string;
  angle: number;
  description: string;
  italic: string;
  target: number;
  raised: number;
  supporters: number;
  days: number;
  state?: 'unlit' | 'lit' | 'funded';
}

export const VILLAGES: Village[] = [
  {
    id: 'educacion',
    name: 'Educación',
    location: 'Sierra Norte · Oaxaca',
    color: '#e8c96d',
    accent: '#c9872a',
    angle: -75,
    description: 'Escuelas en la selva, maestros que enseñan bajo el dosel. Tu luz enciende libros, lápices y mañanas con desayuno.',
    italic: 'Cada niño aprendiendo es una vela encendida.',
    target: 80000,
    raised: 52400,
    supporters: 312,
    days: 42,
  },
  {
    id: 'salud',
    name: 'Salud',
    location: 'Comunidad Mayab · Q. Roo',
    color: '#f08a6a',
    accent: '#b55a3a',
    angle: -15,
    description: 'Brigadas médicas itinerantes, parteras y plantas medicinales. La luz aquí es agua limpia y manos que sanan.',
    italic: 'Sanar el cuerpo para que el alma pueda volar.',
    target: 120000,
    raised: 41200,
    supporters: 184,
    days: 58,
  },
  {
    id: 'arte',
    name: 'Arte & Cultura',
    location: 'Valle de Tepoztlán · Mor.',
    color: '#d9a35a',
    accent: '#c9872a',
    angle: 45,
    description: 'Talleres de cerámica, danza, telar y mural comunitario. Cada pieza es un canto que sostiene la memoria.',
    italic: 'El arte es la lengua que la tierra habla a través de nosotros.',
    target: 45000,
    raised: 38900,
    supporters: 247,
    days: 18,
  },
  {
    id: 'ambiente',
    name: 'Medio Ambiente',
    location: 'Selva Lacandona · Chiapas',
    color: '#9bbf6a',
    accent: '#5e8a3a',
    angle: 105,
    description: 'Reforestación, viveros nativos y cuidado de cenotes sagrados. Devolverle a la tierra lo que ha dado siempre.',
    italic: 'Cada árbol que plantas es un pulmón para el mañana.',
    target: 95000,
    raised: 71300,
    supporters: 408,
    days: 31,
  },
  {
    id: 'animal',
    name: 'Protección Animal',
    location: "Reserva Sian Ka'an · Q.R.",
    color: '#e8a76d',
    accent: '#b56a2a',
    angle: 165,
    description: 'Rescate y rehabilitación de fauna silvestre — jaguares, monos araña, tortugas marinas. Hogares donde respirar.',
    italic: 'Los animales son hermanos que aún recuerdan la canción antigua.',
    target: 65000,
    raised: 22800,
    supporters: 156,
    days: 64,
  },
  {
    id: 'comunidad',
    name: 'Desarrollo Comunitario',
    location: 'Pueblos del Istmo · Oax.',
    color: '#e6c98a',
    accent: '#a8862a',
    angle: -135,
    description: 'Agua, cocinas solares, microcréditos y casas seguras. Cuando una comunidad florece, florecen todas.',
    italic: 'La luz no se reparte. Se multiplica al compartirla.',
    target: 110000,
    raised: 88200,
    supporters: 521,
    days: 12,
  },
];
