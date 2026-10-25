Aca van la forma de los datos en formato ts

como por ejemplo lo siguiente para generar una categoria de para una pagina de TI:

export const CATEGORIA = ['tarjetas graficas', 'procesadores', 'placas base', 'memorias ram'] as const;

// Definimos el tipo Categoria como un tipo de unión de los valores del array CATEGORIA
export type Categoria = (typeof CATEGORIA)[number];

// maximo

export interface Producto {
    id: number;
    nombre: string;
    descripcion: string;
    precio: number;
    categoria: Categoria;
    unidades: number;
}

export type ProductoDatos = Omit<Producto, 'id'>; // Tipo para los datos de un producto sin el id