import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AddressCascadeField } from '../components/AddressCascade'
import { MapPickField } from '../components/MapPickField'
import { NavBar } from '../components/ui'
import {
  formatCascadePath,
  resolveCascadeFromAddress,
  type AddressCascadeValue,
} from '../data/addressTree'
import type { MapPickResult } from '../data/mapPois'
import { useApp } from '../store/AppStore'
import type { Address } from '../types'

export function AddressEditPage() {
  const { id = '' } = useParams()
  const { addresses, saveAddress, toast } = useApp()
  const navigate = useNavigate()
  const exists = addresses.find((a) => a.id === id)
  const [form, setForm] = useState<Address>(
    exists ?? {
      id: `a${Date.now()}`,
      name: '',
      phone: '',
      city: '',
      district: '',
      street: '',
      detail: '',
      inRange: true,
      isDefault: false,
    },
  )
  const [poiName, setPoiName] = useState('')

  const cascade = useMemo(
    () => resolveCascadeFromAddress(form.city, form.district, form.street),
    [form.city, form.district, form.street],
  )

  function set<K extends keyof Address>(key: K, value: Address[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function applyCascade(next: AddressCascadeValue) {
    setForm((prev) => ({
      ...prev,
      city: next.city,
      district: next.district,
      street: next.street,
      inRange: next.inRange,
    }))
  }

  function applyMapPick(next: MapPickResult) {
    setPoiName(next.poiName)
    setForm((prev) => ({
      ...prev,
      city: next.city,
      district: next.district,
      street: next.street,
      inRange: next.inRange,
      detail: prev.detail || next.detailHint || '',
    }))
  }

  const mapSummary = poiName
    ? `${poiName} · ${formatCascadePath(form)}`
    : form.street
      ? formatCascadePath(form)
      : ''

  return (
    <section className="page pad">
      <NavBar title={exists ? '编辑地址' : '新增地址'} />
      <div className="field">
        <label>联系人</label>
        <input value={form.name} onChange={(e) => set('name', e.target.value)} />
      </div>
      <div className="field">
        <label>电话</label>
        <input value={form.phone} onChange={(e) => set('phone', e.target.value)} inputMode="tel" />
      </div>

      <MapPickField summary={mapSummary} onPick={applyMapPick} />
      <AddressCascadeField value={cascade} onChange={applyCascade} />

      <div className="field">
        <label>详细地址</label>
        <textarea
          value={form.detail}
          placeholder="如楼栋、门牌、工位号等"
          onChange={(e) => set('detail', e.target.value)}
        />
      </div>
      <label className="muted">
        <input type="checkbox" checked={form.isDefault} onChange={(e) => set('isDefault', e.target.checked)} />{' '}
        设为默认地址
      </label>
      <button
        className="btn block"
        type="button"
        style={{ marginTop: 16 }}
        onClick={() => {
          if (!form.name || !form.phone) {
            toast('请填写联系人和电话')
            return
          }
          if (!form.city || !form.district || !form.street) {
            toast('请选择完整的收货位置')
            return
          }
          saveAddress(form)
          toast(form.inRange ? '地址已保存' : '已保存，但该地址暂不可配送')
          navigate(-1)
        }}
      >
        保存
      </button>
    </section>
  )
}
