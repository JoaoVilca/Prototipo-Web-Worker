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
      
      // Medir tiempo total de comunicación (envío + espera + recepción)
      performance.mark('start-worker-communication');
      this.worker.onmessage = ({ data }) => {
        performance.mark('end-worker-communication');
        performance.measure('worker-communication-time', 'start-worker-communication', 'end-worker-communication');
        
        if (data && data.error) {
          reject(data.error);
        } else {
          resolve(data as TResponse);
        }
      };
      
      // Enviar mensaje al worker (postMessage serializa automáticamente)
      this.worker.postMessage(message);
    });
  }

  async parseJson(file: File): Promise<any[]> {
    // Enviar solo la referencia del archivo al worker para que lo lea directamente
    const result = await this.postToWorker({ action: 'parse', file: file });
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

}
