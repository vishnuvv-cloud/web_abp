const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
export const useMockData = import.meta.env.VITE_USE_MOCK_DATA !== 'false'
export async function request(path, options={}) {
  if (!baseUrl) throw new Error('Set VITE_API_BASE_URL to use API mode.')
  const response = await fetch(`${baseUrl}${path}`, { headers:{'Content-Type':'application/json',...options.headers}, ...options })
  if (!response.ok) throw new Error(`Request failed (${response.status})`)
  return response.json()
}
