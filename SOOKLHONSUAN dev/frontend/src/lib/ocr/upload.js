export async function uploadImage(file) {
  const form = new FormData();
  form.append("image", file);

  const res = await fetch(`${window.location.origin}/api/extract`, {
    method: "POST",
    body: form,
  });

  return res.json();
}

export async function extractFields(text) {
  const res = await fetch(`${window.location.origin}/api/extract-fields`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  return res.json();
}
