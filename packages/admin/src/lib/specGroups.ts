import type { SpecGroup, SpecOption, SpecSelectMode } from '../types'

export function newSpecId(prefix = 'sg') {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export function summarizeSpecGroups(groups: SpecGroup[]): string {
  if (!groups.length) return '无规格'
  return groups.map((g) => g.name).join(' · ')
}

export function makeSpecOption(name: string, extraPrice = 0, id?: string): SpecOption {
  return { id: id ?? newSpecId('so'), name, extraPrice }
}

export function makeSpecGroup(
  name: string,
  mode: SpecSelectMode,
  options: SpecOption[],
  required = mode === 'single',
  id?: string,
): SpecGroup {
  return { id: id ?? newSpecId('sg'), name, mode, required, options }
}

/** 默认单品规格组（空选项，需从选项库选取） */
export function defaultSpecGroups(first?: { name: string; extraPrice: number }): SpecGroup[] {
  const opts = first ? [makeSpecOption(first.name, first.extraPrice)] : []
  return [makeSpecGroup('份量', 'single', opts, true)]
}

type FlatOpt = { id: string; name: string; extraPrice: number }

function pick(opts: FlatOpt[], names: string[]) {
  const set = new Set(names)
  return opts.filter((o) => set.has(o.name))
}

function rest(opts: FlatOpt[], used: FlatOpt[]) {
  const ids = new Set(used.map((o) => o.id))
  return opts.filter((o) => !ids.has(o.id))
}

function toOptions(opts: FlatOpt[]): SpecOption[] {
  return opts.map((o) => makeSpecOption(o.name, o.extraPrice, o.id))
}

/**
 * 将历史扁平规格选项 intelligently 拆成单选/多选规格组。
 * 无法归类的选项落入「规格」单选组。
 */
export function autoSpecGroups(opts: FlatOpt[]): SpecGroup[] {
  if (!opts.length) return defaultSpecGroups()

  const portion = pick(opts, [
    '标准份',
    '加大份',
    '双人份',
    '双人拼',
    '中杯',
    '大杯',
    '大碗',
    '加大碗',
  ])
  const spice = pick(opts, ['微辣', '中辣', '特辣', '蒜香'])
  const noodle = pick(opts, ['细粉', '粗粉'])
  const sauce = pick(opts, ['油醋汁', '芝麻酱', '千岛酱'])
  const ice = pick(opts, ['少冰', '去冰', '少糖'])
  const topping = opts.filter(
    (o) =>
      o.name.startsWith('加') ||
      ['珍珠', '椰果', '芝士', '加芝士', '加奶油', '加蒜蓉', '加酸笋', '加牛肉', '加肉'].includes(
        o.name,
      ),
  )

  const used: FlatOpt[] = []
  const groups: SpecGroup[] = []

  const take = (list: FlatOpt[]) => {
    used.push(...list)
    return list
  }

  if (portion.length) {
    const name = portion.some((o) => /杯/.test(o.name)) ? '杯型' : '份量'
    groups.push(makeSpecGroup(name, 'single', toOptions(take(portion)), true))
  }
  if (noodle.length) {
    groups.push(makeSpecGroup('粉型', 'single', toOptions(take(noodle)), true))
  }
  if (spice.length) {
    const name = spice.every((o) => /辣/.test(o.name)) ? '辣度' : '口味'
    groups.push(makeSpecGroup(name, 'single', toOptions(take(spice)), true))
  }
  if (sauce.length) {
    groups.push(makeSpecGroup('酱汁', 'single', toOptions(take(sauce)), true))
  }
  if (ice.length) {
    groups.push(makeSpecGroup('冰量/甜度', 'single', toOptions(take(ice)), false))
  }

  const toppings = topping.filter((o) => !used.some((u) => u.id === o.id))
  if (toppings.length) {
    groups.push(makeSpecGroup('加料', 'multi', toOptions(take(toppings)), false))
  }

  const leftover = rest(opts, used)
  if (leftover.length) {
    groups.push(makeSpecGroup('规格', 'single', toOptions(leftover), true))
  }

  return groups.length ? groups : defaultSpecGroups()
}

export function validateSpecGroups(groups: SpecGroup[]): string | null {
  if (!groups.length) return '请至少配置一个规格组'
  for (const g of groups) {
    if (!g.name.trim()) return '规格组名称不能为空'
    if (!g.options.length) return `规格组「${g.name || '未命名'}」至少需要一个选项`
    for (const o of g.options) {
      if (!o.name.trim()) return `规格组「${g.name}」存在未命名选项`
    }
  }
  return null
}
