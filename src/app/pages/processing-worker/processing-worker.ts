import { NgFor, NgIf } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Dataset } from '../../services/dataset';

@Component({
  selector: 'app-processing-worker',
  imports: [FormsModule, NgIf, NgFor],
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
    if (!this.file) return alert('Seleccione un archivo');
    // Número de hilos (main + worker)
    const threadCount = (typeof Worker !== 'undefined') ? 2 : 1;
    performance.mark('start-read-worker-parse');
    const mainThreadStart = performance.now();

    this.zone.run(() => {
      this.loading = true;
      this.cdr.detectChanges();
    });

    this.loading = true;
    let text = '';
    let workerTime = 0;
    let mainThreadTime = 0;
    try {
      //text = await this.file.text();
      performance.mark('end-read-worker-parse');
      performance.measure('file-read-worker-parse', 'start-read-worker-parse', 'end-read-worker-parse');
      //const mainThreadBeforeWorker = performance.now();
      performance.mark('start-worker-processing-parse');
      const processedData = await this.datasetService.parseJson(this.file);
      performance.mark('end-worker-processing-parse');
      performance.measure('worker-processing-parse', 'start-worker-processing-parse', 'end-worker-processing-parse');

      const mainThreadAfterWorker = performance.now();
      workerTime = performance.getEntriesByName('worker-processing-parse')[0]?.duration || 0;
      mainThreadTime = (mainThreadAfterWorker - mainThreadStart);

      this.zone.run(() => {
        this.data = processedData;
        this.loading = false;
        this.cdr.detectChanges();
      });

    } catch (error) {
      console.error(error);
      this.zone.run(() => {
        this.loading = false;
        this.cdr.detectChanges();
      });
    } finally {
      this.loading = false;
      const readTime = performance.getEntriesByName('file-read-worker-parse')[0]?.duration || 0;
      const totalTime = readTime + mainThreadTime;
      // Estimación de tiempo de bloqueo: tiempo en main thread menos tiempo en worker
      const estimatedBlockingTime = mainThreadTime;
      console.log('--- KPIs CON WORKER --- PROCESAR');
      console.log('Hilos utilizados:', threadCount);
      console.log('Lectura:', readTime + ' ms');
      console.log('Procesamiento en worker:', workerTime + ' ms');
      console.log('Procesamiento en hilo principal:', mainThreadTime + ' ms');
      console.log('Tiempo estimado de bloqueo de página:', estimatedBlockingTime + ' ms');
      console.log('Total procesamiento:', totalTime + ' ms');
      console.log('Registros procesados:', this.data.length);
    }
  }

  async ordenar() {
    if (!this.data || this.data.length === 0) {
      return alert('No hay datos para ordenar. Primero procese un archivo.');
    }
    // Número de hilos (main + worker)
    const threadCount = (typeof Worker !== 'undefined') ? 2 : 1;
    const mainThreadStart = performance.now();
    performance.mark('start-worker-processing-sort');

    this.loading = true;
    let workerTime = 0;
    let mainThreadTime = 0;
    try {
      const sorted = await this.datasetService.sortData(this.data);

      performance.mark('end-worker-processing-sort');
      performance.measure('worker-processing-sort', 'start-worker-processing-sort', 'end-worker-processing-sort');
      const mainThreadAfterWorker = performance.now();
      workerTime = performance.getEntriesByName('worker-processing-sort')[0]?.duration || 0;
      mainThreadTime = (mainThreadAfterWorker - mainThreadStart) - workerTime;

      this.zone.run(() => {
        this.data = sorted;
        this.loading = false;
        this.cdr.detectChanges();
      });
    } catch (error) {
      console.error(error);
      this.loading = false;
    } finally {
      const readTime = 0;
      const totalTime = readTime + workerTime;
      const estimatedBlockingTime = mainThreadTime;
      console.log('--- KPIs CON WORKER --- ORDENAR');
      console.log('Hilos utilizados:', threadCount);
      console.log('Lectura:', readTime + ' ms');
      console.log('Procesamiento en worker:', workerTime + ' ms');
      console.log('Procesamiento en hilo principal:', mainThreadTime + ' ms');
      console.log('Tiempo estimado de bloqueo de página:', estimatedBlockingTime + ' ms');
      console.log('Total procesamiento:', totalTime + ' ms');
      console.log('Registros procesados:', this.data.length);
    }
  }

  async filtrar() {
    if (!this.data || this.data.length === 0) {
      return alert('No hay datos para filtrar. Primero procese un archivo.');
    }

    if (!this.filter || this.filter.trim().length === 0) {
      return alert('Ingrese un texto de filtro.');
    }

    // Número de hilos (main + worker)
    const threadCount = (typeof Worker !== 'undefined') ? 2 : 1;
    const mainThreadStart = performance.now();
    performance.mark('start-worker-processing-filter');

    this.loading = true;
    let workerTime = 0;
    let mainThreadTime = 0;
    try {
      const filtered = await this.datasetService.filterData(this.data, this.filter);

      performance.mark('end-worker-processing-filter');
      performance.measure('worker-processing-filter', 'start-worker-processing-filter', 'end-worker-processing-filter');
      const mainThreadAfterWorker = performance.now();
      workerTime = performance.getEntriesByName('worker-processing-filter')[0]?.duration || 0;
      mainThreadTime = (mainThreadAfterWorker - mainThreadStart) - workerTime;

      this.zone.run(() => {
        this.data = filtered;
        this.loading = false;
        this.cdr.detectChanges();
      });
    } catch (error) {
      console.error(error);
      this.loading = false;
    } finally {
      const readTime = 0;
      const totalTime = readTime + workerTime;
      const estimatedBlockingTime = mainThreadTime;
      console.log('--- KPIs CON WORKER --- FILTRAR');
      console.log('Hilos utilizados:', threadCount);
      console.log('Lectura:', readTime + ' ms');
      console.log('Procesamiento en worker:', workerTime + ' ms');
      console.log('Procesamiento en hilo principal:', mainThreadTime + ' ms');
      console.log('Tiempo estimado de bloqueo de página:', estimatedBlockingTime + ' ms');
      console.log('Total procesamiento:', totalTime + ' ms');
      console.log('Registros procesados:', this.data.length);
    }
  }
}
