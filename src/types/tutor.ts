export interface FranjaHoraria {
  id: string;
  texto: string; // ej: "9:00 - 10:30 AM"
  disponible: boolean;
}

export interface DiaDisponible {
  diaSemana: string; // ej: "VIE", "MIE"
  numero: number; // ej: 5
  disponible: boolean;
  franjas: FranjaHoraria[];
}

export interface Tutor {
  id: string;
  nombres: string;
  apellidos: string;
  iniciales: string;
  semestreTexto: string; // ej: "6º semestre MACC - claustro"
  sede: string; // "Claustro" | "Mutis" | "Norte"
  modalidad: string; // "Presencial" | "Virtual" | "Híbrida"
  descripcion: string;
  precioHora: number;
  precioFormato: string; // "$20.000 x hora"
  materiaPrincipal: string; // "calculo II"
  estrellas: number; // 4.9
  diasDisponibles?: DiaDisponible[];
}
