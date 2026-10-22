import type { SpecGroup, SpecOption, SpecSelectMode } from '../types'

let seq = 0
function nid(prefix: string) {
  seq += 1
  return `${prefix}${seq}`
}

export function makeOption(name: string, extra = 0): SpecOption {
  return { id: nid('so'), name, extra }
}

export function makeGroup(
  name: string,
  mode: SpecSelectMode,
  options: SpecOption[],
  required = mode === 'single',
): SpecGroup {
  return { id: nid('sg'), name, mode, required, options }
}

/** 历史扁平规格 → 单个单选组 */
export function fromFlat(
  items: { name: string; extra: number }[],
  groupName = '规格',
): SpecGroup[] {
  if (!items.length) {
    return [makeGroup('份量', 'single', [makeOption('标准份', 0)], true)]
  }
  return [makeGroup(groupName, 'single', items.map((i) => makeOption(i.name, i.extra)), true)]
}

/** 按选项名拆成单选/多选组（与后台逻辑对齐的简化版） */
export function autoGroups(items: { name: string; extra: number }[]): SpecGroup[] {
  if (!items.length) return fromFlat([])

  const portionNames = new Set([
    '标准份',
    '加大份',
    '双人份',
    '双人拼',
    '中杯',
    '大杯',
    '大碗',
    '加大碗',
    '标准碗',
  ])
  const spiceNames = new Set(['微辣', '中辣', '特辣', '蒜香'])
  const noodleNames = new Set(['细粉', '粗粉'])
  const sauceNames = new Set(['油醋汁', '芝麻酱', '千岛酱'])
  const iceNames = new Set(['少冰', '去冰', '少糖'])

  const portion = items.filter((i) => portionNames.has(i.name))
  const spice = items.filter((i) => spiceNames.has(i.name))
  const noodle = items.filter((i) => noodleNames.has(i.name))
  const sauce = items.filter((i) => sauceNames.has(i.name))
  const ice = items.filter((i) => iceNames.has(i.name))
  const topping = items.filter(
    (i) => i.name.startsWith('加') || ['珍珠', '椰果', '加芝士', '加奶油', '加蒜蓉'].includes(i.name),
  )

  const used = new Set<string>()
  const take = (list: typeof items) => {
    list.forEach((i) => used.add(i.name))
    return list.map((i) => makeOption(i.name, i.extra))
  }

  const groups: SpecGroup[] = []
  if (portion.length) {
    const name = portion.some((i) => /杯/.test(i.name)) ? '杯型' : '份量'
    groups.push(makeGroup(name, 'single', take(portion), true))
  }
  if (noodle.length) groups.push(makeGroup('粉型', 'single', take(noodle), true))
  if (spice.length) {
    const name = spice.every((i) => /辣/.test(i.name)) ? '辣度' : '口味'
    groups.push(makeGroup(name, 'single', take(spice), true))
  }
  if (sauce.length) groups.push(makeGroup('酱汁', 'single', take(sauce), true))
  if (ice.length) groups.push(makeGroup('冰量/甜度', 'single', take(ice), false))
  const tops = topping.filter((i) => !used.has(i.name))
  if (tops.length) groups.push(makeGroup('加料', 'multi', take(tops), false))
  const left = items.filter((i) => !used.has(i.name))
  if (left.length) groups.push(makeGroup('规格', 'single', take(left), true))
  return groups.length ? groups : fromFlat(items)
}

export type SpecSelection = Record<string, string[]>

export function defaultSelection(groups: SpecGroup[]): SpecSelection {
  const sel: SpecSelection = {}
  for (const g of groups) {
    if (g.mode === 'single' && g.required && g.options[0]) {
      sel[g.id] = [g.options[0].id]
    } else {
      sel[g.id] = []
    }
  }
  return sel
}

export function selectionValid(groups: SpecGroup[], sel: SpecSelection): boolean {
  return groups.every((g) => {
    const picked = sel[g.id] ?? []
    if (g.required && picked.length < 1) return false
    if (g.mode === 'single' && picked.length > 1) return false
    return true
  })
}

export function selectionExtra(groups: SpecGroup[], sel: SpecSelection): number {
  let sum = 0
  for (const g of groups) {
    const picked = new Set(sel[g.id] ?? [])
    for (const o of g.options) {
      if (picked.has(o.id)) sum += o.extra
    }
  }
  return sum
}

export function selectionLabel(groups: SpecGroup[], sel: SpecSelection): string {
  const names: string[] = []
  for (const g of groups) {
    const picked = new Set(sel[g.id] ?? [])
    for (const o of g.options) {
      if (picked.has(o.id)) names.push(o.name)
    }
  }
  return names.join(' / ') || '标准'
}

export function toggleOption(
  groups: SpecGroup[],
  sel: SpecSelection,
  groupId: string,
  optionId: string,
): SpecSelection {
  const g = groups.find((x) => x.id === groupId)
  if (!g) return sel
  const cur = sel[groupId] ?? []
  if (g.mode === 'single') {
    return { ...sel, [groupId]: cur[0] === optionId && !g.required ? [] : [optionId] }
  }
  const on = cur.includes(optionId)
  return {
    ...sel,
    [groupId]: on ? cur.filter((id) => id !== optionId) : [...cur, optionId],
  }
}
