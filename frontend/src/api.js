const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(
  /\/$/,
  ""
);
const STAFF_TOKEN = import.meta.env.VITE_STAFF_TOKEN || "";

async function handle(res) {
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const err = new Error((data && data.error) || "Erro na requisicao.");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// ---- Publico ----
export async function createRegistration(payload) {
  const res = await fetch(`${API_URL}/api/registrations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handle(res);
}

export async function getRegistration(code) {
  const res = await fetch(`${API_URL}/api/registrations/${encodeURIComponent(code)}`);
  return handle(res);
}

export async function createAfyaQuizResponse(payload) {
  const res = await fetch(`${API_URL}/api/afya-quiz`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handle(res);
}

export async function createMinasRegistration(payload) {
  const res = await fetch(`${API_URL}/api/minas-registrations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handle(res);
}

export async function getMinasRegistration(id) {
  const res = await fetch(
    `${API_URL}/api/minas-registrations/${encodeURIComponent(id)}`,
  );
  return handle(res);
}

// ---- Equipe (tablet) ----
export async function staffLookup(code) {
  const res = await fetch(
    `${API_URL}/api/staff/lookup/${encodeURIComponent(code)}`,
    { headers: { "x-staff-token": STAFF_TOKEN } }
  );
  return handle(res);
}

export async function staffRedeem(code) {
  const res = await fetch(
    `${API_URL}/api/staff/redeem/${encodeURIComponent(code)}`,
    { method: "POST", headers: { "x-staff-token": STAFF_TOKEN } }
  );
  return handle(res);
}

export async function staffListRegistrations() {
  const res = await fetch(`${API_URL}/api/staff/registrations`, {
    headers: { "x-staff-token": STAFF_TOKEN },
  });
  return handle(res);
}

export async function staffListAfyaQuizResponses() {
  const res = await fetch(`${API_URL}/api/staff/afya-quiz`, {
    headers: { "x-staff-token": STAFF_TOKEN },
  });
  return handle(res);
}

export async function staffListMinasRegistrations() {
  const res = await fetch(`${API_URL}/api/staff/minas-registrations`, {
    headers: { "x-staff-token": STAFF_TOKEN },
  });
  return handle(res);
}

export { API_URL };
