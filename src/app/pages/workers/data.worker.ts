// data.worker.ts
addEventListener('message', async ({ data }) => {
  const { action, file, payload, filter } = data as {
    action: 'parse' | 'filter' | 'sort';
    file?: File;
    payload?: any[];
    filter?: string;
  };

  try {
    let dataset: any[] = [];

    if (action === 'parse' && file) {
      // Leer archivo directamente en el worker
      performance.mark('start-file-read');
      const text = await file.text();
      performance.mark('end-file-read');
      performance.measure('file-read-time', 'start-file-read', 'end-file-read');

      const fileReadTime = performance.getEntriesByName('file-read-time')[0]?.duration || 0;
      console.log('Tiempo de lectura de archivo:', fileReadTime + ' ms');

      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        dataset = parsed;
      } else {
        dataset = Object.values(parsed);
      }
    } else if (Array.isArray(payload)) {
      dataset = payload.slice();
    }

    if (!Array.isArray(dataset)) {
      postMessage({ error: 'El JSON debe ser un array de objetos o convertible a lista.' });
      return;
    }

    let result: any[] = dataset;

    switch (action) {
      case 'parse':
        // Already parsed above
        break;
      case 'filter':
        if (filter && filter.trim().length > 0) {
          const needle = filter.toLowerCase();
          result = dataset.filter(item =>
            JSON.stringify(item).toLowerCase().includes(needle)
          );
        }
        break;
      case 'sort':
        if (dataset.length > 0) {
          const sample = dataset[0] ?? {};
          if (sample.id !== undefined) {
            result = dataset.slice().sort((a: any, b: any) => {
              const av = Number(a.id);
              const bv = Number(b.id);
              return av - bv;
            });
          } else if (sample.name !== undefined) {
            result = dataset.slice().sort((a: any, b: any) => {
              const av = String(a.name).toLowerCase();
              const bv = String(b.name).toLowerCase();
              return av.localeCompare(bv);
            });
          } else {
            // Fallback: stable stringify-based sort
            result = dataset.slice().sort((a: any, b: any) => {
              const av = JSON.stringify(a);
              const bv = JSON.stringify(b);
              return av.localeCompare(bv);
            });
          }
        }
        break;
      default:
        postMessage({ error: 'Acción no soportada' });
        return;
    }

    postMessage(result);
  } catch (err) {
    let errorMsg = 'Error al procesar el archivo.';
    if (err instanceof Error) {
      errorMsg += ' ' + err.message;
    } else if (typeof err === 'string') {
      errorMsg += ' ' + err;
    }
    postMessage({ error: errorMsg });
  }
});
