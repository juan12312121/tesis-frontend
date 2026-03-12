import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Autenticacion } from '../autenticacion/autenticacion'; // ← IMPORTAR

export interface UploadResponse {
  success: boolean;
  message?: string;
  data?: {
    url: string;
    filename: string;
    originalName: string;
    size: number;
    mimetype: string;
  };
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class Fotos {
  private readonly API_URL = 'http://localhost:3000/api/upload';
  private maxFileSize = 5 * 1024 * 1024; // 5MB
  private allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  constructor(
    private http: HttpClient,
    private authService: Autenticacion // ← INYECTAR SERVICIO AUTH
  ) {}

  /**
   * Sube una imagen al servidor
   */
  subirImagen(file: File): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<UploadResponse>(
      `${this.API_URL}/imagen`,
      formData,
      { headers: this.authService.getAuthHeaders().delete('Content-Type') } // ← USAR AUTH (sin Content-Type para FormData)
    );
  }

  /**
   * Elimina una imagen del servidor
   */
  eliminarImagen(filename: string): Observable<any> {
    return this.http.delete(
      `${this.API_URL}/imagen/${filename}`,
      { headers: this.authService.getAuthHeaders() } // ← USAR AUTH
    );
  }

  /**
   * Valida que el archivo sea una imagen válida
   */
  validarImagen(file: File): ValidationResult {
    if (!file) {
      return { valid: false, error: 'No se ha seleccionado ningún archivo' };
    }

    if (!this.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Formato no válido. Solo se permiten imágenes JPG, PNG, GIF o WEBP'
      };
    }

    if (file.size > this.maxFileSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return {
        valid: false,
        error: `El archivo es demasiado grande (${sizeMB}MB). El tamaño máximo es 5MB`
      };
    }

    return { valid: true };
  }

  /**
   * Crea una vista previa de la imagen seleccionada
   */
  crearVistaPrevia(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        resolve(e.target.result);
      };

      reader.onerror = () => {
        reject(new Error('Error al leer el archivo'));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Obtiene el nombre del archivo desde una URL
   */
  obtenerNombreArchivo(url: string): string {
    if (!url) return '';
    return url.split('/').pop() || '';
  }

  /**
   * Formatea el tamaño del archivo
   */
  formatearTamano(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Comprime una imagen antes de subirla
   */
  comprimirImagen(
    file: File,
    maxWidth: number = 1920,
    maxHeight: number = 1080,
    quality: number = 0.8
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        const img = new Image();

        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File(
                  [blob],
                  file.name,
                  { type: file.type, lastModified: Date.now() }
                );
                resolve(compressedFile);
              } else {
                reject(new Error('Error al comprimir la imagen'));
              }
            },
            file.type,
            quality
          );
        };

        img.onerror = () => reject(new Error('Error al cargar la imagen'));
        img.src = e.target.result;
      };

      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Verifica si una URL es válida
   */
  esUrlValida(url: string): boolean {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Obtiene información de una imagen
   */
  obtenerInfoImagen(file: File): Promise<{
    width: number;
    height: number;
    aspectRatio: number;
    size: string;
    type: string;
  }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        const img = new Image();

        img.onload = () => {
          resolve({
            width: img.width,
            height: img.height,
            aspectRatio: img.width / img.height,
            size: this.formatearTamano(file.size),
            type: file.type
          });
        };

        img.onerror = () => reject(new Error('Error al cargar la imagen'));
        img.src = e.target.result;
      };

      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsDataURL(file);
    });
  }
}


