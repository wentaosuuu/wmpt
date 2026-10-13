import { useEffect, useMemo, useState } from 'react'
import { DescList, Field, Modal, PageHeader, Panel, StatusTag, Toolbar } from '../../components/ui'
import { useAdmin } from '../../store/AdminStore'
import type { DishCategory, DishSpec, Product } from '../../types'

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
      notify('请先在「规格管理」中为该门店创建规格')
      return
    }
    const cat = storeCats[0]
    const spec = storeSpecs[0]
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
      specIds: [spec.id],
      spec: spec.name,
      photo: '',
    })
    setMode('edit')
  }

  return (
    <>
      <PageHeader
        title="菜品管理"
        desc="先选择门店，再维护该门店菜品。分类与规格请在对应菜单中配置。"
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
                <th>规格</th>
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
                  <td>{p.spec}</td>
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
                  <td colSpan={8}>
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
        width={640}
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
                if (!form.name || !form.categoryId || !form.specIds.length) {
                  notify('请填写菜品名称，并选择分类与规格')
                  return
                }
                if (!form.description.trim()) {
                  notify('请填写商品描述')
                  return
                }
                const cat = storeCats.find((c) => c.id === form.categoryId)
                const selected = storeSpecs.filter((s) => form.specIds.includes(s.id))
                saveProduct({
                  ...form,
                  category: cat?.name ?? form.category,
                  spec: selected.map((s) => s.name).join(' / '),
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
            <Field label="所属门店">
              <input value={form.storeName} disabled />
            </Field>
            <Field label="菜品名称">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="分类">
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
            <Field label="价格（元）">
              <input
                type="number"
                min={0}
                step="0.1"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) || 0 })}
              />
            </Field>
            <Field label="初始库存">
              <input
                type="number"
                step={1}
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
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
              <label>可选规格（可多选）</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 13 }}>
                {storeSpecs.map((s) => (
                  <label key={s.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <input
                      type="checkbox"
                      checked={form.specIds.includes(s.id)}
                      onChange={(e) => {
                        const specIds = e.target.checked
                          ? [...form.specIds, s.id]
                          : form.specIds.filter((id) => id !== s.id)
                        setForm({ ...form, specIds })
                      }}
                    />
                    {s.name}
                    {s.extraPrice ? ` (+¥${s.extraPrice})` : ''}
                  </label>
                ))}
              </div>
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

  function batchEnable(enabled: boolean) {
    if (!selected.length) {
      notify('请先勾选分类')
      return
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
                <th>操作</th>
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
                      onClick={() => updateCategory(c.id, { enabled: !c.enabled })}
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

  function batchEnable(enabled: boolean) {
    if (!selected.length) {
      notify('请先勾选规格')
      return
    }
    selected.forEach((id) => updateSpec(id, { enabled }))
    notify(enabled ? `已批量启用 ${selected.length} 个规格` : `已批量停用 ${selected.length} 个规格`)
    clear()
  }

  return (
    <>
      <PageHeader
        title="规格管理"
        desc="按门店维护规格选项（如标准份、加肉、微辣），菜品可多选关联。"
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
            新增规格
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
          <input placeholder="搜索规格" value={kw} onChange={(e) => setKw(e.target.value)} />
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
                <th>规格名称</th>
                <th>加价</th>
                <th>状态</th>
                <th>关联菜品数</th>
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
                  <td>{products.filter((p) => p.specIds.includes(s.id)).length}</td>
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
                    <div className="empty-block">该门店暂无规格</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>

      <Modal
        open={!!form}
        title={specs.some((s) => s.id === form?.id) ? '编辑规格' : '新增规格'}
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
                  notify('请填写规格名称')
                  return
                }
                saveSpec(form)
                notify('规格已保存')
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
            <Field label="规格名称">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="加价（元）">
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
        title="删除规格"
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
                if (products.some((p) => p.specIds.includes(removeId) && p.specIds.length <= 1)) {
                  notify('仍有菜品仅关联该规格，请先调整菜品后再删')
                  return
                }
                removeSpec(removeId)
                notify('规格已删除')
                setRemoveId(null)
              }}
            >
              确认删除
            </button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 14, color: '#4e5969' }}>确认删除该规格？已关联菜品将移除该规格选项。</p>
      </Modal>
    </>
  )
}

export function StockPage() {
  const { products, updateProduct, notify } = useAdmin()
  const { stores, storeId, setStoreId, store } = useStoreFilter()
  const [kw, setKw] = useState('')
  const [current, setCurrent] = useState<Product | null>(null)
  const [stock, setStock] = useState(0)
  const [batchStock, setBatchStock] = useState('50')
  const [mode, setMode] = useState<'edit' | 'soldout' | 'batch' | null>(null)

  const storeProducts = products.filter((p) => p.storeId === storeId)
  const list = storeProducts.filter((p) => !kw || p.name.includes(kw))

  return (
    <>
      <PageHeader
        title="库存售罄"
        desc="库存可为负数；是否禁止消费者下单只看「售罄」标记，与库存数字无关。"
        extra={
          <button
            className="btn"
            type="button"
            disabled={!storeProducts.length}
            onClick={() => {
              setBatchStock('50')
              setMode('batch')
            }}
          >
            一键设置库存
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
          <input placeholder="搜索菜品" value={kw} onChange={(e) => setKw(e.target.value)} />
          <button
            className="btn ghost"
            type="button"
            disabled={!storeProducts.length}
            onClick={() => {
              setBatchStock('50')
              setMode('batch')
            }}
          >
            一键设置库存
          </button>
        </Toolbar>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>菜品</th>
                <th>规格</th>
                <th>
                  库存
                  <i
                    className="tip-icon"
                    tabIndex={0}
                    data-tip="库存允许为负数，仅作账面数量参考，不会单独禁止下单。"
                    aria-label="库存说明"
                  >
                    ?
                  </i>
                </th>
                <th>
                  售卖状态
                  <i
                    className="tip-icon"
                    tabIndex={0}
                    data-tip="标记「售罄」后，用户端不可下单；恢复「可售」后即可下单。与库存是否为负无关。"
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
                  <td className={p.stock < 0 ? 'stock-neg' : undefined}>{p.stock}</td>
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
                        setStock(p.stock)
                        setMode('edit')
                      }}
                    >
                      改库存
                    </button>
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
                  <td colSpan={5}>
                    <div className="empty-block">该门店暂无菜品</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>

      <Modal
        open={mode === 'edit' && !!current}
        title="修改库存"
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
                if (!Number.isFinite(stock)) {
                  notify('请输入有效的库存数量')
                  return
                }
                updateProduct(current.id, { stock: Math.floor(stock) })
                notify('库存已更新（不影响售罄状态）')
                setMode(null)
              }}
            >
              保存
            </button>
          </>
        }
      >
        <Field label="菜品">
          <input value={current?.name ?? ''} disabled />
        </Field>
        <Field label="库存数量">
          <input
            type="number"
            step={1}
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
          />
        </Field>
        <p style={{ margin: '8px 0 0', fontSize: 13, color: '#86909c' }}>
          允许负数。修改库存不会自动改售罄状态；禁止用户下单请用「标记售罄」。
        </p>
      </Modal>

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
                notify(
                  soldOut
                    ? '已标记售罄：用户端不可下单（库存数字不变）'
                    : '已恢复可售：用户端可下单',
                )
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
            ? `确认将「${current?.name}」恢复可售？恢复后消费者可下单，当前库存 ${current?.stock} 不变。`
            : `确认将「${current?.name}」标记为售罄？标记后消费者不可下单，当前库存 ${current?.stock} 不变。`}
        </p>
      </Modal>

      <Modal
        open={mode === 'batch'}
        title="一键设置全部菜品库存"
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
                const n = Math.floor(Number(batchStock))
                if (!Number.isFinite(n)) {
                  notify('请输入有效的库存数量')
                  return
                }
                storeProducts.forEach((p) => updateProduct(p.id, { stock: n }))
                notify(
                  `已将「${store?.name ?? '当前门店'}」${storeProducts.length} 道菜品库存设为 ${n}（售罄状态不变）`,
                )
                setMode(null)
              }}
            >
              确认设置
            </button>
          </>
        }
      >
        <DescList
          items={[
            { label: '门店', value: store?.name },
            { label: '菜品数', value: String(storeProducts.length) },
          ]}
        />
        <Field label="统一库存数量">
          <input
            type="number"
            step={1}
            value={batchStock}
            onChange={(e) => setBatchStock(e.target.value)}
            placeholder="例如 50，可为负数"
          />
        </Field>
        <p style={{ margin: '0 0 4px', fontSize: 13, color: '#86909c' }}>
          仅批量改库存数字，不会改各菜品的售罄 / 可售状态。
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
