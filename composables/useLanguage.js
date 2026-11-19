import translations from '~/data/ingles.json'

export function useLanguage() {
  const language = useState('english-quest-language', () => 'es')
  const t = (spanish) => language.value === 'en' ? translations[spanish] ?? spanish : spanish

  function translateContent(value) {
    if (typeof value === 'string') return t(value)
    if (Array.isArray(value)) return value.map(translateContent)
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [
        key,
        key === 'debilidad' || key === 'id' || key === 'tipo' ? item : translateContent(item)
      ]))
    }
    return value
  }

  return { language, t, translateContent }
}
