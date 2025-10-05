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
      this.worker.onmessage = ({ data }) => {
        if (data && data.error) {
          reject(data.error);
        } else {
          resolve(data as TResponse);
        }
      };
      this.worker.postMessage(message);
    });
  }

  async parseJson(file: File): Promise<any[]> {
    const text = await this.readFileAsText(file);
    return this.postToWorker({ action: 'parse', fileContent: text });
  }

  async filterData(current: any[], filter: string): Promise<any[]> {
    return this.postToWorker({ action: 'filter', payload: current, filter });
  }

  async sortData(current: any[]): Promise<any[]> {
    return this.postToWorker({ action: 'sort', payload: current });
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
