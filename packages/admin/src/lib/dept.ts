import type { SysDept } from '../types'

/** 部门层级：1 市 → 2 区 → 3 门店/商家 */
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
  if (depth <= 1) return '市'
  if (depth === 2) return '区'
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

/** 三级门店节点（所属商家下拉用） */
export function merchantDepts(depts: SysDept[]) {
  return depts
    .filter((d) => d.status === 'enabled' && deptDepth(depts, d.id) === 3)
    .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, 'zh'))
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
