const BASE_URL = "http://localhost:4000/api";

export async function uploadImage(file) {
  const form = new FormData();
  form.append("image", file);

  const res = await fetch(`${BASE_URL}/extract`, {
    method: "POST",
    body: form,
  });

  return await res.json();
}
