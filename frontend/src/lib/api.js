export async function uploadCsvFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/predict/upload", {
    method: "POST",
    body: formData
  });

  const rawBody = await response.text();
  let data = {};

  if (rawBody) {
    try {
      data = JSON.parse(rawBody);
    } catch {
      data = { detail: rawBody };
    }
  }

  if (!response.ok) {
    throw new Error(data.detail || `Upload failed with status ${response.status}`);
  }

  if (!rawBody) {
    throw new Error("Backend returned an empty response.");
  }

  return data;
}

export async function fetchLenderDashboard() {
  const response = await fetch("/predict/lender-dashboard");
  const rawBody = await response.text();
  let data = {};

  if (rawBody) {
    try {
      data = JSON.parse(rawBody);
    } catch {
      data = { detail: rawBody };
    }
  }

  if (!response.ok) {
    throw new Error(data.detail || `Lender dashboard failed with status ${response.status}`);
  }

  return data;
}
