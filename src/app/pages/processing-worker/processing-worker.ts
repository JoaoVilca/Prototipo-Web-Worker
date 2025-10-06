import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Dataset } from '../../services/dataset';

@Component({
  selector: 'app-processing-worker',
  imports: [FormsModule, CommonModule],
  standalone: true,
  templateUrl: './processing-worker.html',
  styleUrl: './processing-worker.scss'
})
export class ProcessingWorker {
  file?: File;
  filter: string = '';
  data: any[] = [];
  loading: boolean = false;

  constructor(
    private datasetService: Dataset,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) { }

  onFileSelected(event: any) {
    this.file = event.target.files[0];
  }

  async process() {
    // Limpiar mediciones anteriores
    performance.clearMarks();
    performance.clearMeasures();
    
    performance.mark('start-total-process');
    if (!this.file) return alert('Seleccione un archivo');
    
    // Número de hilos (main + worker)
    const threadCount = (typeof Worker !== 'undefined') ? 2 : 1;
    const mainThreadStart = performance.now();

    this.zone.run(() => {
      this.loading = true;
      this.cdr.detectChanges();
    });

    this.loading = true;
    let fileReadTime = 0;
    let workerProcessingTime = 0;
    let workerCommunicationTime = 0;
    let mainThreadBlockingTime = 0;
    let totalTime = 0;
    
    try {
      // Medir tiempo total de parseJson (incluye lectura + worker)
      performance.mark('start-parse-json');
      const processedData = await this.datasetService.parseJson(this.file);
      performance.mark('end-parse-json');
      performance.measure('total-parse-json', 'start-parse-json', 'end-parse-json');

      const mainThreadAfterWorker = performance.now();
      
      // Obtener tiempos de las mediciones
      const totalParseTime = performance.getEntriesByName('total-parse-json')[0]?.duration || 0;
      
      // El tiempo de bloqueo del hilo principal es el tiempo total menos el tiempo en worker
      // Como el worker corre en paralelo, el tiempo de bloqueo real es menor
      mainThreadBlockingTime = mainThreadAfterWorker - mainThreadStart;
      totalTime = totalParseTime;

      this.zone.run(() => {
        this.data = processedData;
        this.loading = false;
        this.cdr.detectChanges();
      });
      
      performance.mark('end-total-process');
      performance.measure('total-process-time', 'start-total-process', 'end-total-process');

    } catch (error) {
      console.error(error);
      this.zone.run(() => {
        this.loading = false;
        this.cdr.detectChanges();
      });
    } finally {
      this.loading = false;
      
      // Obtener mediciones finales
      const finalTotalTime = performance.getEntriesByName('total-process-time')[0]?.duration || 0;
      const fileReadTime = performance.getEntriesByName('file-read-time')[0]?.duration || 0;
      const workerCommTime = performance.getEntriesByName('worker-communication-time')[0]?.duration || 0;
      const workerSerializationTime = performance.getEntriesByName('worker-serialization-time')[0]?.duration || 0;
      const workerDeserializationTime = performance.getEntriesByName('worker-deserialization-time')[0]?.duration || 0;
      const workerPostMessageTime = performance.getEntriesByName('worker-post-message-time')[0]?.duration || 0;
      
      console.log('--- KPIs CON WORKER --- PROCESAR');
      console.log('Hilos utilizados:', threadCount);
      console.log('Tiempo total de procesamiento:', finalTotalTime + ' ms');
      console.log('Tiempo de lectura de archivo:', fileReadTime + ' ms');
      console.log('Tiempo de comunicación con worker:', workerCommTime + ' ms');
      console.log('  - Serialización:', workerSerializationTime + ' ms');
      console.log('  - PostMessage:', workerPostMessageTime + ' ms');
      console.log('  - Deserialización:', workerDeserializationTime + ' ms');
      console.log('Tiempo de bloqueo del hilo principal:', mainThreadBlockingTime + ' ms');
      console.log('Registros procesados:', this.data.length);
      
      // Log adicional para debugging
      console.log('--- Performance Entries ---');
      performance.getEntriesByType('measure').forEach(entry => {
        console.log(`${entry.name}: ${entry.duration.toFixed(2)} ms`);
      });
    }
  }

  async ordenar() {
    if (!this.data || this.data.length === 0) {
      return alert('No hay datos para ordenar. Primero procese un archivo.');
    }
    
    // Limpiar mediciones anteriores
    performance.clearMarks();
    performance.clearMeasures();
    
    performance.mark('start-total-sort');
    // Número de hilos (main + worker)
    const threadCount = (typeof Worker !== 'undefined') ? 2 : 1;
    const mainThreadStart = performance.now();

    this.loading = true;
    let mainThreadBlockingTime = 0;
    
    try {
      performance.mark('start-sort-operation');
      const sorted = await this.datasetService.sortData(this.data);
      performance.mark('end-sort-operation');
      performance.measure('total-sort-operation', 'start-sort-operation', 'end-sort-operation');

      const mainThreadAfterWorker = performance.now();
      mainThreadBlockingTime = mainThreadAfterWorker - mainThreadStart;

      this.zone.run(() => {
        this.data = sorted;
        this.loading = false;
        this.cdr.detectChanges();
      });
      
      performance.mark('end-total-sort');
      performance.measure('total-sort-time', 'start-total-sort', 'end-total-sort');
      
    } catch (error) {
      console.error(error);
      this.loading = false;
    } finally {
      const totalSortTime = performance.getEntriesByName('total-sort-time')[0]?.duration || 0;
      const workerCommTime = performance.getEntriesByName('worker-communication-time')[0]?.duration || 0;
      const workerSerializationTime = performance.getEntriesByName('worker-serialization-time')[0]?.duration || 0;
      const workerDeserializationTime = performance.getEntriesByName('worker-deserialization-time')[0]?.duration || 0;
      const workerPostMessageTime = performance.getEntriesByName('worker-post-message-time')[0]?.duration || 0;
      
      console.log('--- KPIs CON WORKER --- ORDENAR');
      console.log('Hilos utilizados:', threadCount);
      console.log('Tiempo total de ordenamiento:', totalSortTime + ' ms');
      console.log('Tiempo de comunicación con worker:', workerCommTime + ' ms');
      console.log('  - Serialización:', workerSerializationTime + ' ms');
      console.log('  - PostMessage:', workerPostMessageTime + ' ms');
      console.log('  - Deserialización:', workerDeserializationTime + ' ms');
      console.log('Tiempo de bloqueo del hilo principal:', mainThreadBlockingTime + ' ms');
      console.log('Registros procesados:', this.data.length);
      
      // Log adicional para debugging
      console.log('--- Performance Entries ---');
      performance.getEntriesByType('measure').forEach(entry => {
        console.log(`${entry.name}: ${entry.duration.toFixed(2)} ms`);
      });
    }
  }

  async filtrar() {
    if (!this.data || this.data.length === 0) {
      return alert('No hay datos para filtrar. Primero procese un archivo.');
    }

    if (!this.filter || this.filter.trim().length === 0) {
      return alert('Ingrese un texto de filtro.');
    }

    // Limpiar mediciones anteriores
    performance.clearMarks();
    performance.clearMeasures();
    
    performance.mark('start-total-filter');
    // Número de hilos (main + worker)
    const threadCount = (typeof Worker !== 'undefined') ? 2 : 1;
    const mainThreadStart = performance.now();

    this.loading = true;
    let mainThreadBlockingTime = 0;
    
    try {
      performance.mark('start-filter-operation');
      const filtered = await this.datasetService.filterData(this.data, this.filter);
      performance.mark('end-filter-operation');
      performance.measure('total-filter-operation', 'start-filter-operation', 'end-filter-operation');

      const mainThreadAfterWorker = performance.now();
      mainThreadBlockingTime = mainThreadAfterWorker - mainThreadStart;

      this.zone.run(() => {
        this.data = filtered;
        this.loading = false;
        this.cdr.detectChanges();
      });
      
      performance.mark('end-total-filter');
      performance.measure('total-filter-time', 'start-total-filter', 'end-total-filter');
      
    } catch (error) {
      console.error(error);
      this.loading = false;
    } finally {
      const totalFilterTime = performance.getEntriesByName('total-filter-time')[0]?.duration || 0;
      const workerCommTime = performance.getEntriesByName('worker-communication-time')[0]?.duration || 0;
      const workerSerializationTime = performance.getEntriesByName('worker-serialization-time')[0]?.duration || 0;
      const workerDeserializationTime = performance.getEntriesByName('worker-deserialization-time')[0]?.duration || 0;
      const workerPostMessageTime = performance.getEntriesByName('worker-post-message-time')[0]?.duration || 0;
      
      console.log('--- KPIs CON WORKER --- FILTRAR');
      console.log('Hilos utilizados:', threadCount);
      console.log('Tiempo total de filtrado:', totalFilterTime + ' ms');
      console.log('Tiempo de comunicación con worker:', workerCommTime + ' ms');
      console.log('  - Serialización:', workerSerializationTime + ' ms');
      console.log('  - PostMessage:', workerPostMessageTime + ' ms');
      console.log('  - Deserialización:', workerDeserializationTime + ' ms');
      console.log('Tiempo de bloqueo del hilo principal:', mainThreadBlockingTime + ' ms');
      console.log('Registros procesados:', this.data.length);
      
      // Log adicional para debugging
      console.log('--- Performance Entries ---');
      performance.getEntriesByType('measure').forEach(entry => {
        console.log(`${entry.name}: ${entry.duration.toFixed(2)} ms`);
      });
    }
  }
}
