import zhJSON from './zh-CN.json'
import enJSON from './en.json'

let localeMessage: {
  [_: string]: string
} = {}

const setLocale = (lang: string) => {
  localeMessage = lang === 'zh-CN' ? zhJSON : enJSON
}

setLocale(navigator.language ?? navigator.languages?.[0])

export { setLocale }

export default function (key: string): string {
  return localeMessage[key] ?? ''
}
