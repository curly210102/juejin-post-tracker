import check from './check.svg'
import iconStyle from './sprite.module.css'

const icons = {
  check
}

const iconIds = Object.fromEntries(
  Object.entries(icons).map(([name, value]) => [name, value.match(/<symbol id="([^"]+)"/)?.[1]])
)

const xmlns = 'http://www.w3.org/2000/svg'
const xlink = 'http://www.w3.org/1999/xlink'
const svgSpriteElement = document.createElementNS(xmlns, 'svg')
svgSpriteElement.setAttribute('aria-hidden', 'true')
svgSpriteElement.setAttribute('style', 'position: absolute; width: 0; height: 0; overflow: hidden;')
svgSpriteElement.setAttribute('version', '1.1')
svgSpriteElement.setAttribute('xmlns', xmlns)
svgSpriteElement.setAttribute('xmlns:xlink', xlink)
svgSpriteElement.innerHTML = ['<defs>', ...Object.values(icons), '</defs>'].join('')
document.body.appendChild(svgSpriteElement)

export const renderIcon = (iconId: string, ...classList: string[]) => {
  const svgElement = document.createElementNS(xmlns, 'svg')
  const useElement = document.createElementNS(xmlns, 'use')
  svgElement.classList.add(iconStyle.icon, ...classList)
  useElement.setAttributeNS(xlink, 'href', `#${iconIds[iconId]}`)
  svgElement.appendChild(useElement)
  return svgElement
}
