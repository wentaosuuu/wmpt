import { isImageIcon } from '../lib/cuisineApi'

export function CatIcon({ icon }: { icon: string }) {
  if (isImageIcon(icon)) {
    return <img className="cat-quick-icon-img" src={icon} alt="" />
  }
  return <>{icon}</>
}
