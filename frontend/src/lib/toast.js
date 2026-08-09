// Tiny imperative toast system. Any component can call toast.success/error/info
// and a floating stack will render at the bottom.
let listeners = new Set()
let nextId = 1

function emit(t) {
  const id = nextId++
  const item = { id, ...t }
  listeners.forEach(fn => fn({ type: 'add', item }))
  const ttl = t.ttl ?? 3200
  if (ttl > 0) {
    setTimeout(() => {
      listeners.forEach(fn => fn({ type: 'remove', id }))
    }, ttl)
  }
  return id
}

export const toast = {
  success: (message, opts = {}) => emit({ kind: 'success', message, ...opts }),
  error:   (message, opts = {}) => emit({ kind: 'error',   message, ...opts, ttl: opts.ttl ?? 5000 }),
  info:    (message, opts = {}) => emit({ kind: 'info',    message, ...opts }),
  loading: (message, opts = {}) => emit({ kind: 'loading', message, ttl: 0, ...opts }),
  dismiss: (id) => listeners.forEach(fn => fn({ type: 'remove', id })),
  _subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn) },
}
