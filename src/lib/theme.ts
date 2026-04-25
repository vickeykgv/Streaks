export type Theme = 'light' | 'dark' | 'system'

export function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', prefersDark)
  } else {
    root.classList.toggle('dark', theme === 'dark')
  }
}

export function initTheme() {
  const saved = (localStorage.getItem('theme') as Theme) ?? 'dark'
  applyTheme(saved)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const current = (localStorage.getItem('theme') as Theme) ?? 'system'
    if (current === 'system') applyTheme('system')
  })
}

export function setTheme(theme: Theme) {
  localStorage.setItem('theme', theme)
  applyTheme(theme)
}
