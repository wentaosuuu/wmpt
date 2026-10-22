import { useEffect, useMemo, useState } from 'react'
import { DescList, Field, Modal, PageHeader, Panel, StatusTag, Toolbar } from '../../components/ui'
import {
  defaultSpecGroups,
  makeSpecGroup,
  makeSpecOption,
  summarizeSpecGroups,
  validateSpecGroups,
} from '../../lib/specGroups'
import { useAdmin } from '../../store/AdminStore'
import type { DishCategory, DishSpec, Product, SpecGroup } from '../../types'

/** 单品规格组编辑器：选项只能从门店「规格选项库」弹窗勾选 */
function SpecGroupEditor({
  groups,
  library,
  onChange,
}: {
  groups: SpecGroup[]
  library: DishSpec[]
  onChange: (next: SpecGroup[]) => void
}) {
  const [pickerGroupId, setPickerGroupId] = useState<string | null>(null)
  const [pickerKw, setPickerKw] = useState('')
  const [pickerSelected, setPickerSelected] = useState<string[]>([])

  const pickerGroup = groups.find((g) => g.id === pickerGroupId)
  const usedNames = useMemo(
    () => new Set(pickerGroup?.options.map((o) => o.name) ?? []),
    [pickerGroup],
  )
  const available = useMemo(
    () => library.filter((s) => !usedNames.has(s.name)),
    [library, usedNames],
  )
  const filtered = useMemo(() => {
    const kw = pickerKw.trim()
    if (!kw) return available
    return available.filter((s) => s.name.includes(kw))
  }, [available, pickerKw])

  function patchGroup(id: string, patch: Partial<SpecGroup>) {
    onChange(groups.map((g) => (g.id === id ? { ...g, ...patch } : g)))
  }

  function removeGroup(id: string) {
    onChange(groups.filter((g) => g.id !== id))
  }

  function addGroup() {
    onChange([...groups, makeSpecGroup('新规格组', 'single', [], true)])
  }

  function removeOption(groupId: string, optId: string) {
    onChange(
      groups.map((g) => {
        if (g.id !== groupId) return g
        return { ...g, options: g.options.filter((o) => o.id !== optId) }
      }),
    )
  }

  function openPicker(groupId: string) {
    setPickerGroupId(groupId)
    setPickerKw('')
    setPickerSelected([])
  }

  function closePicker() {
    setPickerGroupId(null)
    setPickerKw('')
    setPickerSelected([])
  }

  function confirmPicker() {
    if (!pickerGroupId || !pickerSelected.length) {
      closePicker()
      return
    }
    const picked = library.filter((s) => pickerSelected.includes(s.id))
    onChange(
      groups.map((g) => {
        if (g.id !== pickerGroupId) return g
        const exist = new Set(g.options.map((o) => o.name))
        const add = picked
          .filter((s) => !exist.has(s.name))
          .map((s) => makeSpecOption(s.name, s.extraPrice))
        return { ...g, options: [...g.options, ...add] }
      }),
    )
    closePicker()
  }

  function togglePickerItem(id: string) {
    setPickerSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function togglePickerAll() {
    const ids = filtered.map((s) => s.id)
    const allOn = ids.length > 0 && ids.every((id) => pickerSelected.includes(id))
    if (allOn) {
      setPickerSelected((prev) => prev.filter((id) => !ids.includes(id)))
    } else {
      setPickerSelected((prev) => [...new Set([...prev, ...ids])])
    }
  }

  const filteredAllSelected =
    filtered.length > 0 && filtered.every((s) => pickerSelected.includes(s.id))

  return (
    <div className="spec-group-editor">
      <div className="spec-group-editor-head">
        <div>
          <strong>规格配置</strong>
          <p className="attach-hint" style={{ margin: '4px 0 0' }}>
            按本单品配置规格组（单选/多选）。选项须从「规格选项库」选取，不可自由填写；库内无合适项请先去选项库新增。
          </p>
        </div>
        <button className="btn ghost" type="button" onClick={addGroup}>
          添加规格组
        </button>
      </div>
      {!library.length ? (
        <p className="spec-library-empty">该门店选项库为空，请先在左侧「规格选项库」中添加常用选项。</p>
      ) : null}
      {!groups.length ? <p className="muted" style={{ margin: '8px 0' }}>暂无规格组，请添加</p> : null}
      {groups.map((g) => {
        const left = library.filter((s) => !g.options.some((o) => o.name === s.name)).length
        return (
          <div key={g.id} className="spec-group-card">
            <div className="spec-group-card-head">
              <input
                className="spec-group-name"
                value={g.name}
                placeholder="规格组名称，如杯型、加料"
                onChange={(e) => patchGroup(g.id, { name: e.target.value })}
              />
              <div className="spec-group-modes">
                <label>
                  <input
                    type="radio"
                    name={`mode-${g.id}`}
                    checked={g.mode === 'single'}
                    onChange={() => patchGroup(g.id, { mode: 'single', required: true })}
                  />
                  单选
                </label>
                <label>
                  <input
                    type="radio"
                    name={`mode-${g.id}`}
                    checked={g.mode === 'multi'}
                    onChange={() => patchGroup(g.id, { mode: 'multi', required: false })}
                  />
                  多选
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={g.required}
                    onChange={(e) => patchGroup(g.id, { required: e.target.checked })}
                  />
                  必选
                </label>
              </div>
              <button
                className="link-btn danger"
                type="button"
                disabled={groups.length <= 1}
                onClick={() => removeGroup(g.id)}
              >
                删除组
              </button>
            </div>
            <div className="spec-option-chips">
              {g.options.map((o) => (
                <span key={o.id} className="spec-option-chip">
                  {o.name}
                  {o.extraPrice ? ` +¥${o.extraPrice}` : ''}
                  <button
                    type="button"
                    className="spec-option-chip-x"
                    aria-label={`移除 ${o.name}`}
                    onClick={() => removeOption(g.id, o.id)}
                  >
                    ×
                  </button>
                </span>
              ))}
              {!g.options.length ? (
                <span className="spec-option-empty">尚未选择选项</span>
              ) : null}
            </div>
            <div className="spec-group-card-actions">
              <button
                className="btn ghost"
                type="button"
                disabled={!library.length || left === 0}
                onClick={() => openPicker(g.id)}
              >
                {left === 0 && library.length ? '选项已全部选用' : '从选项库选择'}
              </button>
            </div>
          </div>
        )
      })}

      <Modal
        open={!!pickerGroupId}
        title={`选择规格选项${pickerGroup?.name ? ` · ${pickerGroup.name}` : ''}`}
        width={480}
        onClose={closePicker}
        footer={
          <>
            <button className="btn ghost" type="button" onClick={closePicker}>
              取消
            </button>
            <button
              className="btn"
              type="button"
              disabled={!pickerSelected.length}
              onClick={confirmPicker}
            >
              确认添加{pickerSelected.length ? `（${pickerSelected.length}）` : ''}
            </button>
          </>
        }
      >
        <div className="spec-picker">
          <input
            className="spec-picker-search"
            placeholder="搜索选项名称"
            value={pickerKw}
            onChange={(e) => setPickerKw(e.target.value)}
            autoFocus
          />
          <div className="spec-picker-toolbar">
            <label>
              <input
                type="checkbox"
                checked={filteredAllSelected}
                disabled={!filtered.length}
                onChange={togglePickerAll}
              />
              全选当前列表
            </label>
            <span className="muted">
              可选 {available.length} 项
              {pickerKw.trim() ? ` · 筛选 ${filtered.length}` : ''}
            </span>
          </div>
          <div className="spec-picker-list">
            {filtered.map((s) => (
              <label key={s.id} className="spec-picker-item">
                <input
                  type="checkbox"
                  checked={pickerSelected.includes(s.id)}
                  onChange={() => togglePickerItem(s.id)}
                />
                <span className="spec-picker-name">{s.name}</span>
                <span className="spec-picker-price">
                  {s.extraPrice ? `+¥${s.extraPrice}` : '不加价'}
                </span>
              </label>
            ))}
            {!filtered.length ? (
              <div className="empty-block">
                {available.length ? '无匹配选项' : '没有可添加的选项了'}
              </div>
            ) : null}
          </div>
        </div>
      </Modal>
    </div>
  )
}

function useStoreFilter() {
  const { merchants } = useAdmin()
  const stores = merchants.filter((m) => m.status === 'approved')
  const [storeId, setStoreId] = useState(() => stores[0]?.id ?? '')
  const effectiveId = storeId && stores.some((s) => s.id === storeId) ? storeId : stores[0]?.id ?? ''
  return {
    stores,
    storeId: effectiveId,
    setStoreId,
    store: stores.find((s) => s.id === effectiveId),
  }
}

/** 表格行多选：支持全选 / 清空，切换门店时重置 */
function useRowSelection(ids: string[], resetKey: string) {
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    setSelected([])
  }, [resetKey])

  const selectedInList = useMemo(() => selected.filter((id) => ids.includes(id)), [selected, ids])
  const allSelected = ids.length > 0 && ids.every((id) => selected.includes(id))

  function toggleAll() {
    setSelected(allSelected ? [] : [...ids])
  }

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function clear() {
    setSelected([])
  }

  return { selected: selectedInList, allSelected, toggleAll, toggle, clear }
}

export function DishesPage() {
  const { products, categories, specs, updateProduct, saveProduct, notify } = useAdmin()
  const { stores, storeId, setStoreId, store } = useStoreFilter()
  const [kw, setKw] = useState('')
  const [current, setCurrent] = useState<Product | null>(null)
  const [form, setForm] = useState<Product | null>(null)
  const [mode, setMode] = useState<'shelf' | 'edit' | null>(null)

  const storeCats = categories.filter((c) => c.storeId === storeId && c.enabled)
  const storeSpecs = specs.filter((s) => s.storeId === storeId && s.enabled)

  const list = useMemo(
    () =>
      products.filter(
        (p) => p.storeId === storeId && (!kw || p.name.includes(kw) || p.category.includes(kw)),
      ),
    [products, storeId, kw],
  )
  const listIds = useMemo(() => list.map((p) => p.id), [list])
  const { selected, allSelected, toggleAll, toggle, clear } = useRowSelection(
    listIds,
    `${storeId}|${kw}`,
  )

  function batchShelf(onShelf: boolean) {
    if (!selected.length) {
      notify('请先勾选菜品')
      return
    }
    selected.forEach((id) => updateProduct(id, { onShelf }))
    notify(onShelf ? `已批量上架 ${selected.length} 个菜品` : `已批量下架 ${selected.length} 个菜品`)
    clear()
  }

  function openCreate() {
    if (!store) {
      notify('请先选择门店')
      return
    }
    if (!storeCats.length) {
      notify('请先在「菜品分类」中为该门店创建分类')
      return
    }
    if (!storeSpecs.length) {
      notify('请先在「规格选项库」中为该门店添加选项')
      return
    }
    const cat = storeCats[0]
    const first = storeSpecs[0]
    const groups = defaultSpecGroups({ name: first.name, extraPrice: first.extraPrice })
    setForm({
      id: `d${Date.now()}`,
      storeId: store.id,
      storeName: store.name,
      name: '',
      description: '',
      categoryId: cat.id,
      category: cat.name,
      price: 0,
      packingFee: 0,
      utensils: '',
      stock: 50,
      soldOut: false,
      onShelf: false,
      specGroups: groups,
      spec: summarizeSpecGroups(groups),
      photo: '',
    })
    setMode('edit')
  }

  return (
    <>
      <PageHeader
        title="菜品管理"
        desc="先选择门店，再维护该门店菜品。规格按单品配置（支持单选/多选组）；选项库可在「规格管理」维护。"
        extra={
          <button className="btn" type="button" onClick={openCreate}>
            新增菜品
          </button>
        }
      />
      <Panel>
        <Toolbar>
          <select value={storeId} onChange={(e) => setStoreId(e.target.value)}>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <input placeholder="搜索菜品 / 分类" value={kw} onChange={(e) => setKw(e.target.value)} />
          <button className="btn ghost" type="button" disabled={!selected.length} onClick={() => batchShelf(true)}>
            批量上架
          </button>
          <button className="btn ghost" type="button" disabled={!selected.length} onClick={() => batchShelf(false)}>
            批量下架
          </button>
          {selected.length ? (
            <span style={{ fontSize: 13, color: '#86909c' }}>已选 {selected.length} 项</span>
          ) : null}
        </Toolbar>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th className="check">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    disabled={!list.length}
                    onChange={toggleAll}
                    aria-label="全选"
                  />
                </th>
                <th>图片</th>
                <th>菜品</th>
                <th>分类</th>
                <th>价格</th>
                <th>上架状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td className="check">
                    <input
                      type="checkbox"
                      checked={selected.includes(p.id)}
                      onChange={() => toggle(p.id)}
                      aria-label={`选择 ${p.name}`}
                    />
                  </td>
                  <td>
                    {p.photo ? (
                      <img className="dish-photo-thumb" src={p.photo} alt="" />
                    ) : (
                      <span className="dish-photo-thumb empty">无图</span>
                    )}
                  </td>
                  <td>{p.name}</td>
                  <td>{p.category}</td>
                  <td>¥{p.price.toFixed(2)}</td>
                  <td>
                    <StatusTag tone={p.onShelf ? 'success' : 'default'}>
                      {p.onShelf ? '已上架' : '已下架'}
                    </StatusTag>
                  </td>
                  <td className="ops">
                    <button
                      className="link-btn"
                      type="button"
                      onClick={() => {
                        setForm({ ...p })
                        setMode('edit')
                      }}
                    >
                      编辑
                    </button>
                    <button
                      className="link-btn"
                      type="button"
                      onClick={() => {
                        setCurrent(p)
                        setMode('shelf')
                      }}
                    >
                      {p.onShelf ? '下架' : '上架'}
                    </button>
                  </td>
                </tr>
              ))}
              {!list.length ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-block">该门店暂无菜品</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>

      <Modal
        open={mode === 'shelf' && !!current}
        title={current?.onShelf ? '确认下架' : '确认上架'}
        onClose={() => setMode(null)}
        footer={
          <>
            <button className="btn ghost" type="button" onClick={() => setMode(null)}>
              取消
            </button>
            <button
              className="btn"
              type="button"
              onClick={() => {
                if (!current) return
                updateProduct(current.id, { onShelf: !current.onShelf })
                notify(current.onShelf ? '已从外卖菜单下架' : '已上架到外卖菜单')
                setMode(null)
              }}
            >
              确认
            </button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 14, color: '#4e5969' }}>
          确认将「{current?.name}」{current?.onShelf ? '下架' : '上架'}？
        </p>
      </Modal>

      <Modal
        open={mode === 'edit' && !!form}
        title={products.some((p) => p.id === form?.id) ? '编辑菜品' : '新增菜品'}
        width={720}
        onClose={() => setMode(null)}
        footer={
          <>
            <button className="btn ghost" type="button" onClick={() => setMode(null)}>
              取消
            </button>
            <button
              className="btn"
              type="button"
              onClick={() => {
                if (!form) return
                if (!form.storeName.trim() || !form.name.trim() || !form.categoryId || !(form.price > 0)) {
                  notify('请填写所属门店、菜品名称、分类和价格')
                  return
                }
                const specErr = validateSpecGroups(form.specGroups)
                if (specErr) {
                  notify(specErr)
                  return
                }
                if (!form.description.trim()) {
                  notify('请填写商品描述')
                  return
                }
                const cat = storeCats.find((c) => c.id === form.categoryId)
                saveProduct({
                  ...form,
                  category: cat?.name ?? form.category,
                  spec: summarizeSpecGroups(form.specGroups),
                })
                notify('菜品已保存')
                setMode(null)
              }}
            >
              保存
            </button>
          </>
        }
      >
        {form ? (
          <div className="form-grid">
            <Field label="所属门店" required>
              <input value={form.storeName} disabled />
            </Field>
            <Field label="菜品名称" required>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="分类" required>
              <select
                value={form.categoryId}
                onChange={(e) => {
                  const cat = storeCats.find((c) => c.id === e.target.value)
                  setForm({ ...form, categoryId: e.target.value, category: cat?.name ?? '' })
                }}
              >
                {storeCats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="价格（元）" required>
              <input
                type="number"
                min={0}
                step="0.1"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) || 0 })}
              />
            </Field>
            <div className="form-field" style={{ gridColumn: '1 / -1' }}>
              <label>商品描述</label>
              <p className="attach-hint" style={{ marginTop: 0 }}>
                显示在移动端菜品详情与菜单列表中，请填写真实商品说明。
              </p>
              <textarea
                rows={3}
                maxLength={120}
                placeholder="如：经典波霸奶茶，甜度冰量请写在备注。"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="form-field" style={{ gridColumn: '1 / -1' }}>
              <SpecGroupEditor
                groups={form.specGroups}
                library={storeSpecs}
                onChange={(specGroups) => setForm({ ...form, specGroups })}
              />
            </div>
            <div className="form-field" style={{ gridColumn: '1 / -1' }}>
              <label>菜品图片</label>
              <p className="attach-hint" style={{ marginTop: 0 }}>
                用于移动端菜单列表与菜品详情展示，建议上传正方形清晰图。
              </p>
              <div className="door-photo-edit">
                {form.photo ? (
                  <img className="dish-photo-preview" src={form.photo} alt="菜品预览" />
                ) : (
                  <div className="dish-photo-preview empty">暂无图片</div>
                )}
                <div className="door-photo-actions">
                  <label className="btn ghost door-photo-upload">
                    {form.photo ? '更换图片' : '上传图片'}
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        e.target.value = ''
                        if (!file) return
                        if (!file.type.startsWith('image/')) {
                          notify('请选择图片文件')
                          return
                        }
                        if (file.size > 2 * 1024 * 1024) {
                          notify('图片请控制在 2MB 以内')
                          return
                        }
                        const reader = new FileReader()
                        reader.onload = () => {
                          setForm({ ...form, photo: String(reader.result || '') })
                        }
                        reader.readAsDataURL(file)
                      }}
                    />
                  </label>
                  {form.photo ? (
                    <button
                      className="link-btn danger"
                      type="button"
                      onClick={() => setForm({ ...form, photo: '' })}
                    >
                      移除
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  )
}

export function CategoriesPage() {
  const { categories, saveCategory, updateCategory, removeCategory, products, notify } = useAdmin()
  const { stores, storeId, setStoreId, store } = useStoreFilter()
  const [kw, setKw] = useState('')
  const [form, setForm] = useState<DishCategory | null>(null)
  const [removeId, setRemoveId] = useState<string | null>(null)

  const list = categories.filter(
    (c) => c.storeId === storeId && (!kw || c.name.includes(kw)),
  )
  const listIds = useMemo(() => list.map((c) => c.id), [list])
  const { selected, allSelected, toggleAll, toggle, clear } = useRowSelection(
    listIds,
    `${storeId}|${kw}`,
  )

  function canDisableCategory(categoryId: string) {
    return !products.some((p) => p.categoryId === categoryId && p.onShelf)
  }

  function batchEnable(enabled: boolean) {
    if (!selected.length) {
      notify('请先勾选分类')
      return
    }
    if (!enabled) {
      const blocked = selected.filter((id) => !canDisableCategory(id))
      if (blocked.length) {
        notify('所选分类中有关联菜品仍在上架，无法停用')
        return
      }
    }
    selected.forEach((id) => updateCategory(id, { enabled }))
    notify(enabled ? `已批量启用 ${selected.length} 个分类` : `已批量停用 ${selected.length} 个分类`)
    clear()
  }

  return (
    <>
      <PageHeader
        title="菜品分类"
        desc="按门店维护菜品分类，菜品管理中将以下拉方式选择分类。"
        extra={
          <button
            className="btn"
            type="button"
            onClick={() => {
              if (!store) return
              setForm({
                id: `c${Date.now()}`,
                storeId: store.id,
                storeName: store.name,
                name: '',
                sort: list.length + 1,
                enabled: true,
              })
            }}
          >
            新增分类
          </button>
        }
      />
      <Panel>
        <Toolbar>
          <select value={storeId} onChange={(e) => setStoreId(e.target.value)}>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <input placeholder="搜索分类" value={kw} onChange={(e) => setKw(e.target.value)} />
          <button className="btn ghost" type="button" disabled={!selected.length} onClick={() => batchEnable(true)}>
            批量启用
          </button>
          <button className="btn ghost" type="button" disabled={!selected.length} onClick={() => batchEnable(false)}>
            批量停用
          </button>
          {selected.length ? (
            <span style={{ fontSize: 13, color: '#86909c' }}>已选 {selected.length} 项</span>
          ) : null}
        </Toolbar>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th className="check">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    disabled={!list.length}
                    onChange={toggleAll}
                    aria-label="全选"
                  />
                </th>
                <th>分类名称</th>
                <th>排序</th>
                <th>状态</th>
                <th>关联菜品数</th>
                <th>
                  操作
                  <i
                    className="tip-icon"
                    tabIndex={0}
                    data-tip="当菜品分类有关联的菜品处于上架状态时，不允许停用该分类。"
                    aria-label="操作说明"
                  >
                    ?
                  </i>
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <td className="check">
                    <input
                      type="checkbox"
                      checked={selected.includes(c.id)}
                      onChange={() => toggle(c.id)}
                      aria-label={`选择 ${c.name}`}
                    />
                  </td>
                  <td>{c.name}</td>
                  <td>{c.sort}</td>
                  <td>
                    <StatusTag tone={c.enabled ? 'success' : 'default'}>
                      {c.enabled ? '启用' : '停用'}
                    </StatusTag>
                  </td>
                  <td>{products.filter((p) => p.categoryId === c.id).length}</td>
                  <td className="ops">
                    <button className="link-btn" type="button" onClick={() => setForm({ ...c })}>
                      编辑
                    </button>
                    <button
                      className="link-btn"
                      type="button"
                      onClick={() => {
                        if (c.enabled && !canDisableCategory(c.id)) {
                          notify('该分类有关联菜品仍在上架，无法停用')
                          return
                        }
                        updateCategory(c.id, { enabled: !c.enabled })
                      }}
                    >
                      {c.enabled ? '停用' : '启用'}
                    </button>
                    <button className="link-btn danger" type="button" onClick={() => setRemoveId(c.id)}>
                      删除
                    </button>
                  </td>
                </tr>
              ))}
              {!list.length ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-block">该门店暂无分类</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>

      <Modal
        open={!!form}
        title={categories.some((c) => c.id === form?.id) ? '编辑分类' : '新增分类'}
        onClose={() => setForm(null)}
        footer={
          <>
            <button className="btn ghost" type="button" onClick={() => setForm(null)}>
              取消
            </button>
            <button
              className="btn"
              type="button"
              onClick={() => {
                if (!form?.name) {
                  notify('请填写分类名称')
                  return
                }
                saveCategory(form)
                notify('分类已保存')
                setForm(null)
              }}
            >
              保存
            </button>
          </>
        }
      >
        {form ? (
          <>
            <Field label="门店">
              <input value={form.storeName} disabled />
            </Field>
            <Field label="分类名称">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="排序">
              <input
                type="number"
                value={form.sort}
                onChange={(e) => setForm({ ...form, sort: Number(e.target.value) || 0 })}
              />
            </Field>
          </>
        ) : null}
      </Modal>

      <Modal
        open={!!removeId}
        title="删除分类"
        onClose={() => setRemoveId(null)}
        footer={
          <>
            <button className="btn ghost" type="button" onClick={() => setRemoveId(null)}>
              取消
            </button>
            <button
              className="btn danger"
              type="button"
              onClick={() => {
                if (!removeId) return
                if (products.some((p) => p.categoryId === removeId)) {
                  notify('仍有菜品使用该分类，无法删除')
                  return
                }
                removeCategory(removeId)
                notify('分类已删除')
                setRemoveId(null)
              }}
            >
              确认删除
            </button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 14, color: '#4e5969' }}>删除后不可恢复，确认删除该分类？</p>
      </Modal>
    </>
  )
}

export function SpecsPage() {
  const { specs, saveSpec, updateSpec, removeSpec, products, notify } = useAdmin()
  const { stores, storeId, setStoreId, store } = useStoreFilter()
  const [kw, setKw] = useState('')
  const [form, setForm] = useState<DishSpec | null>(null)
  const [removeId, setRemoveId] = useState<string | null>(null)

  const list = specs.filter((s) => s.storeId === storeId && (!kw || s.name.includes(kw)))
  const listIds = useMemo(() => list.map((s) => s.id), [list])
  const { selected, allSelected, toggleAll, toggle, clear } = useRowSelection(
    listIds,
    `${storeId}|${kw}`,
  )

  /** 选项名在本店菜品规格组中出现的次数（仅作参考，非强绑定） */
  function usageCount(name: string) {
    return products.filter(
      (p) =>
        p.storeId === storeId &&
        p.specGroups.some((g) => g.options.some((o) => o.name === name)),
    ).length
  }

  function batchEnable(enabled: boolean) {
    if (!selected.length) {
      notify('请先勾选选项')
      return
    }
    selected.forEach((id) => updateSpec(id, { enabled }))
    notify(enabled ? `已批量启用 ${selected.length} 项` : `已批量停用 ${selected.length} 项`)
    clear()
  }

  return (
    <>
      <PageHeader
        title="规格管理"
        desc="门店常用规格选项库。真正的单选/多选规格在「菜品管理」里按单品配置，可从本库快速添加选项。"
        extra={
          <button
            className="btn"
            type="button"
            onClick={() => {
              if (!store) return
              setForm({
                id: `sp${Date.now()}`,
                storeId: store.id,
                storeName: store.name,
                name: '',
                extraPrice: 0,
                enabled: true,
              })
            }}
          >
            新增选项
          </button>
        }
      />
      <Panel>
        <Toolbar>
          <select value={storeId} onChange={(e) => setStoreId(e.target.value)}>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <input placeholder="搜索选项" value={kw} onChange={(e) => setKw(e.target.value)} />
          <button className="btn ghost" type="button" disabled={!selected.length} onClick={() => batchEnable(true)}>
            批量启用
          </button>
          <button className="btn ghost" type="button" disabled={!selected.length} onClick={() => batchEnable(false)}>
            批量停用
          </button>
          {selected.length ? (
            <span style={{ fontSize: 13, color: '#86909c' }}>已选 {selected.length} 项</span>
          ) : null}
        </Toolbar>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th className="check">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    disabled={!list.length}
                    onChange={toggleAll}
                    aria-label="全选"
                  />
                </th>
                <th>选项名称</th>
                <th>默认加价</th>
                <th>状态</th>
                <th>菜品中出现</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id}>
                  <td className="check">
                    <input
                      type="checkbox"
                      checked={selected.includes(s.id)}
                      onChange={() => toggle(s.id)}
                      aria-label={`选择 ${s.name}`}
                    />
                  </td>
                  <td>{s.name}</td>
                  <td>¥{s.extraPrice.toFixed(2)}</td>
                  <td>
                    <StatusTag tone={s.enabled ? 'success' : 'default'}>
                      {s.enabled ? '启用' : '停用'}
                    </StatusTag>
                  </td>
                  <td>{usageCount(s.name)}</td>
                  <td className="ops">
                    <button className="link-btn" type="button" onClick={() => setForm({ ...s })}>
                      编辑
                    </button>
                    <button
                      className="link-btn"
                      type="button"
                      onClick={() => updateSpec(s.id, { enabled: !s.enabled })}
                    >
                      {s.enabled ? '停用' : '启用'}
                    </button>
                    <button className="link-btn danger" type="button" onClick={() => setRemoveId(s.id)}>
                      删除
                    </button>
                  </td>
                </tr>
              ))}
              {!list.length ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-block">该门店暂无选项，可先添加常用项供菜品配置时选用</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>

      <Modal
        open={!!form}
        title={specs.some((s) => s.id === form?.id) ? '编辑选项' : '新增选项'}
        onClose={() => setForm(null)}
        footer={
          <>
            <button className="btn ghost" type="button" onClick={() => setForm(null)}>
              取消
            </button>
            <button
              className="btn"
              type="button"
              onClick={() => {
                if (!form?.name) {
                  notify('请填写选项名称')
                  return
                }
                saveSpec(form)
                notify('选项已保存')
                setForm(null)
              }}
            >
              保存
            </button>
          </>
        }
      >
        {form ? (
          <>
            <Field label="门店">
              <input value={form.storeName} disabled />
            </Field>
            <Field label="选项名称">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="默认加价（元）">
              <input
                type="number"
                min={0}
                step="0.1"
                value={form.extraPrice}
                onChange={(e) => setForm({ ...form, extraPrice: Number(e.target.value) || 0 })}
              />
            </Field>
          </>
        ) : null}
      </Modal>

      <Modal
        open={!!removeId}
        title="删除选项"
        onClose={() => setRemoveId(null)}
        footer={
          <>
            <button className="btn ghost" type="button" onClick={() => setRemoveId(null)}>
              取消
            </button>
            <button
              className="btn danger"
              type="button"
              onClick={() => {
                if (!removeId) return
                removeSpec(removeId)
                notify('选项已删除（不影响已配置在菜品上的规格）')
                setRemoveId(null)
              }}
            >
              确认删除
            </button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 14, color: '#4e5969' }}>
          仅从选项库移除。已写入各菜品规格组的选项不会被自动删除。
        </p>
      </Modal>
    </>
  )
}

export function StockPage() {
  const { products, updateProduct, notify } = useAdmin()
  const { stores, storeId, setStoreId } = useStoreFilter()
  const [kw, setKw] = useState('')
  const [current, setCurrent] = useState<Product | null>(null)
  const [mode, setMode] = useState<'soldout' | null>(null)

  const storeProducts = products.filter((p) => p.storeId === storeId)
  const list = storeProducts.filter((p) => !kw || p.name.includes(kw))

  return (
    <>
      <PageHeader
        title="售罄管理"
        desc="标记「售罄」后消费者不可下单；恢复「可售」后即可下单。"
      />
      <Panel>
        <Toolbar>
          <select value={storeId} onChange={(e) => setStoreId(e.target.value)}>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <input placeholder="搜索菜品" value={kw} onChange={(e) => setKw(e.target.value)} />
        </Toolbar>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>菜品</th>
                <th>规格</th>
                <th>
                  售卖状态
                  <i
                    className="tip-icon"
                    tabIndex={0}
                    data-tip="标记「售罄」后，用户端不可下单；恢复「可售」后即可下单。"
                    aria-label="售卖状态说明"
                  >
                    ?
                  </i>
                </th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.spec}</td>
                  <td>
                    <StatusTag tone={p.soldOut ? 'danger' : 'success'}>
                      {p.soldOut ? '售罄' : '可售'}
                    </StatusTag>
                  </td>
                  <td className="ops">
                    <button
                      className="link-btn"
                      type="button"
                      onClick={() => {
                        setCurrent(p)
                        setMode('soldout')
                      }}
                    >
                      {p.soldOut ? '恢复可售' : '标记售罄'}
                    </button>
                  </td>
                </tr>
              ))}
              {!list.length ? (
                <tr>
                  <td colSpan={4}>
                    <div className="empty-block">该门店暂无菜品</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>

      <Modal
        open={mode === 'soldout' && !!current}
        title={current?.soldOut ? '恢复可售' : '标记售罄'}
        onClose={() => setMode(null)}
        footer={
          <>
            <button className="btn ghost" type="button" onClick={() => setMode(null)}>
              取消
            </button>
            <button
              className="btn"
              type="button"
              onClick={() => {
                if (!current) return
                const soldOut = !current.soldOut
                updateProduct(current.id, { soldOut })
                notify(soldOut ? '已标记售罄：用户端不可下单' : '已恢复可售：用户端可下单')
                setMode(null)
              }}
            >
              确认
            </button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 14, color: '#4e5969' }}>
          {current?.soldOut
            ? `确认将「${current?.name}」恢复可售？恢复后消费者可下单。`
            : `确认将「${current?.name}」标记为售罄？标记后消费者不可下单。`}
        </p>
      </Modal>
    </>
  )
}

export function PackingPage() {
  const { merchants, updateMerchant, notify } = useAdmin()
  const [kw, setKw] = useState('')
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [fee, setFee] = useState('1')

  const stores = useMemo(
    () => merchants.filter((m) => m.status === 'approved'),
    [merchants],
  )
  const list = useMemo(
    () => stores.filter((s) => !kw || s.name.includes(kw) || s.address.includes(kw)),
    [stores, kw],
  )
  const current = stores.find((s) => s.id === currentId) ?? null

  return (
    <>
      <PageHeader
        title="包装费设置"
        desc="按门店配置每笔订单的统一包装费，不按菜品累计。"
      />
      <Panel>
        <Toolbar>
          <input placeholder="门店名称 / 地址" value={kw} onChange={(e) => setKw(e.target.value)} />
        </Toolbar>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>门店</th>
                <th>地址</th>
                <th>订单包装费</th>
                <th>说明</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.address}</td>
                  <td>¥{s.orderPackingFee.toFixed(2)}</td>
                  <td>每笔订单固定收取</td>
                  <td className="ops">
                    <button
                      className="link-btn"
                      type="button"
                      onClick={() => {
                        setCurrentId(s.id)
                        setFee(String(s.orderPackingFee))
                      }}
                    >
                      编辑
                    </button>
                  </td>
                </tr>
              ))}
              {!list.length ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-block">暂无门店</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>
      <Modal
        open={!!current}
        title="编辑订单包装费"
        onClose={() => setCurrentId(null)}
        footer={
          <>
            <button className="btn ghost" type="button" onClick={() => setCurrentId(null)}>
              取消
            </button>
            <button
              className="btn"
              type="button"
              onClick={() => {
                if (!current) return
                const n = Number(fee)
                if (!Number.isFinite(n) || n < 0) {
                  notify('请输入有效的包装费金额')
                  return
                }
                updateMerchant(current.id, { orderPackingFee: Math.round(n * 100) / 100 })
                notify('订单包装费已保存')
                setCurrentId(null)
              }}
            >
              保存
            </button>
          </>
        }
      >
        <DescList items={[{ label: '门店', value: current?.name }]} />
        <Field label="每笔订单包装费（元）">
          <input
            type="number"
            min={0}
            step="0.1"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            placeholder="例如 1 或 2"
          />
        </Field>
        <p style={{ margin: '0 0 4px', fontSize: 13, color: '#86909c' }}>
          用户下单时无论选几道菜，包装费均为该固定金额。
        </p>
      </Modal>
    </>
  )
}
