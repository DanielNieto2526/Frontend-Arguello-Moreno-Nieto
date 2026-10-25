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
}
