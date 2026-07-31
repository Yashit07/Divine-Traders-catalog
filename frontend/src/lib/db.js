import { supabase } from './supabase'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function getAuthHeader() {
  const token = sessionStorage.getItem('dt_admin_token')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

async function apiRequest(path, method = 'GET', body = null) {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
  }
  const opts = { method, headers }
  if (body) opts.body = JSON.stringify(body)

  const res = await fetch(`${API_BASE}${path}`, opts)
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.detail || `Server error (${res.status})`)
  }
  return res.json()
}

export async function adminLogin(password) {
  const data = await apiRequest('/api/admin/login', 'POST', { password })
  if (data.token) {
    sessionStorage.setItem('dt_admin_token', data.token)
  }
  return data
}

export function logoutAdmin() {
  sessionStorage.removeItem('dt_admin_token')
}

// READ OPERATIONS (Directly via Supabase Anon Client - Read-Only)
export async function fetchProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function fetchBranding() {
  const { data, error } = await supabase
    .from('branding')
    .select('*')
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function ensureSeeded() {
  const products = await fetchProducts()
  return { seeded: false, count: products.length }
}

// WRITE OPERATIONS (Proxy through backend via JWT)
export async function insertProduct(payload) {
  return apiRequest('/api/products', 'POST', payload)
}

export async function updateProduct(id, payload) {
  return apiRequest(`/api/products/${id}`, 'PUT', payload)
}

export async function deleteProduct(id) {
  return apiRequest(`/api/products/${id}`, 'DELETE')
}

export async function resetCatalog() {
  return apiRequest('/api/products/reset', 'POST')
}

export async function upsertBranding(patch) {
  return apiRequest('/api/branding', 'POST', patch)
}

export function exportJson(products, branding) {
  return JSON.stringify({ products, branding }, null, 2)
}
