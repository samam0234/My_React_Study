import { useEffect } from 'react'
import { resolveDark, useThemeStore } from '@/store/themeStore'
import type { Theme } from '@/store/themeStore'

const LABEL: Record<Theme, string> = { system: '시스템', light: '라이트', dark: '다크' }

/** <html> 에 dark 클래스를 붙인다. 'system' 이면 OS 설정(prefers-color-scheme)을 따라간다. */
function useApplyTheme() {
  const theme = useThemeStore((s) => s.theme)
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = resolveDark(theme, media.matches)
      document.documentElement.classList.toggle('dark', dark)
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
    }
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])
}

export default function ThemeToggle() {
  useApplyTheme()
  const theme = useThemeStore((s) => s.theme)
  const cycle = useThemeStore((s) => s.cycle)
  return (
    <button
      type="button"
      className="btn"
      onClick={cycle}
      aria-label={`테마 전환 (현재: ${LABEL[theme]})`}
      title="시스템 → 라이트 → 다크"
    >
      {theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '🖥️'} {LABEL[theme]}
    </button>
  )
}
