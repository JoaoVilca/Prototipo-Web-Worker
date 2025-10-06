import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class Dataset {

  private worker?: Worker;
  constructor() {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(new URL('../pages/workers/data.worker', import.meta.url));
    }
  }
  private postToWorker<TPayload, TResponse = any[]>(message: any): Promise<TResponse> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject('Web Workers no soportados en este navegador');
        return;
      }
      
      // Medir tiempo de serialización (preparación del mensaje)
      performance.mark('start-worker-serialization');
      const serializedMessage = JSON.parse(JSON.stringify(message)); // Forzar serialización
      performance.mark('end-worker-serialization');
      performance.measure('worker-serialization-time', 'start-worker-serialization', 'end-worker-serialization');
      
      // Medir tiempo de comunicación (envío + espera + recepción)
      performance.mark('start-worker-communication');
      this.worker.onmessage = ({ data }) => {
        performance.mark('end-worker-communication');
        performance.measure('worker-communication-time', 'start-worker-communication', 'end-worker-communication');
        
        // Medir tiempo de deserialización
        performance.mark('start-worker-deserialization');
        let result = data;
        if (data && data.error) {
          performance.mark('end-worker-deserialization');
          performance.measure('worker-deserialization-time', 'start-worker-deserialization', 'end-worker-deserialization');
          reject(data.error);
        } else {
          performance.mark('end-worker-deserialization');
          performance.measure('worker-deserialization-time', 'start-worker-deserialization', 'end-worker-deserialization');
          resolve(result as TResponse);
        }
      };
      
      // Enviar mensaje al worker
      performance.mark('start-worker-post-message');
      this.worker.postMessage(serializedMessage);
      performance.mark('end-worker-post-message');
      performance.measure('worker-post-message-time', 'start-worker-post-message', 'end-worker-post-message');
    });
  }

  async parseJson(file: File): Promise<any[]> {
    // Medir tiempo de lectura de archivo
    performance.mark('start-file-read');
    const text = await this.readFileAsText(file);
    performance.mark('end-file-read');
    performance.measure('file-read-time', 'start-file-read', 'end-file-read');
    
    // Delegar al worker (las mediciones de comunicación se hacen dentro de postToWorker)
    const result = await this.postToWorker({ action: 'parse', fileContent: text });
    
    return result;
  }

  async filterData(current: any[], filter: string): Promise<any[]> {
    // Delegar al worker (las mediciones de comunicación se hacen dentro de postToWorker)
    const result = await this.postToWorker({ action: 'filter', payload: current, filter });
    return result;
  }

  async sortData(current: any[]): Promise<any[]> {
    // Delegar al worker (las mediciones de comunicación se hacen dentro de postToWorker)
    const result = await this.postToWorker({ action: 'sort', payload: current });
    return result;
  }

  /*async processJson(file: File, filter: string): Promise<any[]> {
    const parsed = await this.parseJson(file);
    if (filter && filter.trim().length > 0) {
      return this.filterData(parsed, filter);
    }
    return parsed;
  }*/

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject('Error leyendo el archivo');
      reader.readAsText(file);
    });
  }
}
