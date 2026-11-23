/**
 * Utilidad para optimizar y comprimir imágenes antes de enviarlas al servidor.
 * Convierte archivos de varios megabytes en imágenes JPEG optimizadas (~50KB-90KB)
 * aptas para avatares y miniaturas, evitando el error 413 (Payload Too Large) en Vercel Serverless.
 */
export async function comprimirImagen(
  archivo: File,
  maxDimension: number = 500,
  calidad: number = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawData = event.target?.result as string;
      if (!rawData) {
        resolve('');
        return;
      }

      // Si no es imagen (ej. PDF), devolver como está
      if (!archivo.type.startsWith('image/')) {
        resolve(rawData);
        return;
      }

      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(rawData);
          return;
        }

        // Fondo blanco para imágenes transparentes que se convierten a JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrlOptimizada = canvas.toDataURL('image/jpeg', calidad);
        resolve(dataUrlOptimizada);
      };

      img.onerror = () => {
        // En caso de falla en render de imagen, devolver la original
        resolve(rawData);
      };

      img.src = rawData;
    };

    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(archivo);
  });
}
