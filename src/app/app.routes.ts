import { Routes } from '@angular/router';
import { ProcessingWorker } from './pages/processing-worker/processing-worker';

export const routes: Routes = [
    {
        path: '', redirectTo: 'data-processing',
        pathMatch: 'full'
    }, // página inicial
    { path: 'data-processing', component: ProcessingWorker }, // procesamiento
    { path: '**', redirectTo: '' } // fallback
];
