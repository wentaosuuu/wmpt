import type { SysDept } from '../types'

/** 部门最多两级：1 云宝宝（平台）→ 2 门店 */
export function deptDepth(depts: SysDept[], id: string | null | undefined): number {
  let depth = 0
  let cur = id ? depts.find((d) => d.id === id) : undefined
  while (cur) {
    depth += 1
    cur = cur.parentId ? depts.find((d) => d.id === cur!.parentId) : undefined
    if (depth > 8) break
  }
  return depth
}

export function deptLevelLabel(depth: number) {
  if (depth <= 1) return '平台'
  return '门店'
}

export function deptPath(depts: SysDept[], id: string): string {
  const names: string[] = []
  let cur = depts.find((d) => d.id === id)
  while (cur) {
    names.unshift(cur.name)
    cur = cur.parentId ? depts.find((d) => d.id === cur!.parentId) : undefined
  }
  return names.join(' / ')
}

/** 二级门店节点 */
export function merchantDepts(depts: SysDept[]) {
  return depts
    .filter((d) => d.status === 'enabled' && deptDepth(depts, d.id) === 2)
    .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, 'zh'))
}

/** 某门店是否已被其他部门绑定 */
export function storeBoundByOther(depts: SysDept[], storeId: string, excludeDeptId?: string) {
  return depts.some((d) => d.storeId === storeId && d.id !== excludeDeptId)
}

export function sortDeptsTree(depts: SysDept[]) {
  const byParent = new Map<string | null, SysDept[]>()
  for (const d of depts) {
    const key = d.parentId
    const list = byParent.get(key) ?? []
    list.push(d)
    byParent.set(key, list)
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, 'zh'))
  }
  const out: SysDept[] = []
  function walk(parentId: string | null) {
    for (const d of byParent.get(parentId) ?? []) {
      out.push(d)
      walk(d.id)
    }
  }
  walk(null)
  return out
}
