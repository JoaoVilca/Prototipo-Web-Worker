/// <reference lib="webworker" />

addEventListener('message', ({ data }) => {
  const { fileContent, filter } = data;

  try {
    let jsonData = JSON.parse(fileContent);

    if (!Array.isArray(jsonData)) {
      jsonData = Object.values(jsonData);
    }

    if (filter) {
      jsonData = jsonData.filter((item: any) =>
        JSON.stringify(item).toLowerCase().includes(filter.toLowerCase())
      );
    }

    if (jsonData.length && jsonData[0].id !== undefined) {
      jsonData = jsonData.sort((a: any, b: any) => a.id - b.id);
    }

    postMessage({ success: true, data: jsonData });
  } catch (error: any) {
    postMessage({ success: false, error: error.message });
  }
});
