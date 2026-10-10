import { menus, type MenuGroup } from '../config/menus'

type Props = {
  value: string[]
  onChange: (keys: string[]) => void
}

function childKeys(group: MenuGroup) {
  return group.children.map((c) => c.key)
}

export function MenuPermissionTree({ value, onChange }: Props) {
  const selected = new Set(value)
  const isAll = value.includes('*')

  function setKeys(next: string[]) {
    onChange(Array.from(new Set(next)))
  }

  function toggleAll() {
    if (isAll) setKeys([])
    else setKeys(['*'])
  }

  function toggleLeaf(group: MenuGroup, leafKey: string) {
    if (isAll) {
      const allLeaves = menus.flatMap((m) => ('children' in m ? childKeys(m) : [m.key]))
      const without = allLeaves.filter((k) => k !== leafKey)
      // also keep group keys that still have all children
      const next: string[] = [...without]
      for (const m of menus) {
        if ('children' in m && childKeys(m).every((k) => without.includes(k))) next.push(m.key)
      }
      setKeys(next)
      return
    }
    const next = new Set(selected)
    if (next.has(leafKey)) next.delete(leafKey)
    else next.add(leafKey)

    const kids = childKeys(group)
    const allOn = kids.every((k) => next.has(k))
    if (allOn) next.add(group.key)
    else next.delete(group.key)

    setKeys(Array.from(next))
  }

  function toggleGroup(group: MenuGroup) {
    const kids = childKeys(group)
    if (isAll) {
      const allLeaves = menus.flatMap((m) => ('children' in m ? childKeys(m) : [m.key]))
      const drop = new Set([group.key, ...kids])
      setKeys(allLeaves.filter((k) => !drop.has(k)))
      return
    }
    const allOn = kids.every((k) => selected.has(k)) || selected.has(group.key)
    const next = new Set(selected)
    if (allOn) {
      next.delete(group.key)
      kids.forEach((k) => next.delete(k))
    } else {
      next.add(group.key)
      kids.forEach((k) => next.add(k))
    }
    setKeys(Array.from(next))
  }

  function toggleRoot(key: string) {
    if (isAll) {
      setKeys(
        menus
          .filter((m) => !('to' in m && m.key === key))
          .flatMap((m) => ('children' in m ? [m.key, ...childKeys(m)] : m.key === key ? [] : [m.key])),
      )
      return
    }
    const next = new Set(selected)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setKeys(Array.from(next))
  }

  function groupState(group: MenuGroup): 'all' | 'some' | 'none' {
    if (isAll || selected.has(group.key)) return 'all'
    const kids = childKeys(group)
    const n = kids.filter((k) => selected.has(k)).length
    if (n === 0) return 'none'
    if (n === kids.length) return 'all'
    return 'some'
  }

  return (
    <div className="menu-perm-tree">
      <label className="menu-perm-node root">
        <input type="checkbox" checked={isAll} onChange={toggleAll} />
        <span>全部菜单权限</span>
      </label>
      <ul className="menu-perm-list">
        {menus.map((m) => {
          if ('to' in m) {
            const checked = isAll || selected.has(m.key)
            return (
              <li key={m.key}>
                <label className="menu-perm-node">
                  <input type="checkbox" checked={checked} disabled={isAll} onChange={() => toggleRoot(m.key)} />
                  <span>{m.label}</span>
                </label>
              </li>
            )
          }
          const state = groupState(m)
          return (
            <li key={m.key}>
              <label className="menu-perm-node">
                <input
                  type="checkbox"
                  checked={state === 'all'}
                  ref={(el) => {
                    if (el) el.indeterminate = state === 'some'
                  }}
                  disabled={isAll}
                  onChange={() => toggleGroup(m)}
                />
                <span>{m.label}</span>
              </label>
              <ul className="menu-perm-children">
                {m.children.map((c) => {
                  const checked = isAll || selected.has(c.key) || selected.has(m.key)
                  return (
                    <li key={c.key}>
                      <label className="menu-perm-node">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={isAll}
                          onChange={() => toggleLeaf(m, c.key)}
                        />
                        <span>{c.label}</span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
