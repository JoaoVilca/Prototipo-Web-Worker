import { initPerfume } from 'perfume.js'; 'perfume.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';

// const Perfume: any = PerfumeDefault as any;
// const perfume = new Perfume({
//   analyticsLogger: (metricName: string, data: any) => {
//     console.log('[PERFUME]', metricName, data);
//   }
// });

initPerfume({
  analyticsTracker: (options) => {
    if (options.metricName === 'INP') {
      // Mostrar INP aunque sea 0
      console.log('[PERFUME INP]', options.data ?? 0);
    } else {
      // Mostrar cualquier métrica aunque sea 0
      console.log('[PERFUME]', options.metricName, options.data ?? 0);
    }
  }
});


function logWebVitals(metric: any) {
  if (metric.name === 'INP') {
    // Mostrar INP aunque sea 0
    console.log('[WEB VITALS INP]', Math.round(metric.value) || 0, metric);
  } else {
    // Mostrar cualquier métrica aunque sea 0
    console.log('[WEB VITALS]', metric.name, Math.round(metric.value) || 0, metric);
  }
}

onCLS(logWebVitals);
onFCP(logWebVitals);
onLCP(logWebVitals);
onTTFB(logWebVitals);
onINP(logWebVitals);

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
