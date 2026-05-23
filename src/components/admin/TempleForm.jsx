import { useState } from 'react'
import { KeyRound, Save, X } from 'lucide-react'
import { createTempleLoginId } from '../../lib/templeStore.js'

const defaultDistrict = 'Thiruvananthapuram'

function createEmptyTemple() {
  return {
    id: '',
    loginId: createTempleLoginId(defaultDistrict),
    name: '',
    deity: '',
    district: defaultDistrict,
    status: 'Onboarding',
    plan: 'Basic',
    contact: '',
    description: '',
  }
}

const districts = [
  'Thiruvananthapuram',
  'Kollam',
  'Pathanamthitta',
  'Alappuzha',
  'Kottayam',
  'Idukki',
  'Ernakulam',
  'Thrissur',
  'Palakkad',
  'Malappuram',
  'Kozhikode',
  'Wayanad',
  'Kannur',
  'Kasaragod',
]

const statuses = ['Active', 'Onboarding', 'Paused']
const plans = ['Basic', 'Professional', 'Enterprise']
const inputClass =
  'mt-2 min-h-12 w-full rounded-md border border-[#D4A017]/22 bg-[#F8F6F0] px-4 text-[#0B1F3A] outline-none transition placeholder:text-[#42516A]/48 focus:border-[#D4A017] focus:bg-white'

export default function TempleForm({
  editingTemple,
  isSaving = false,
  onCancel,
  onSave,
  saveError = '',
}) {
  const [form, setForm] = useState(() => editingTemple || createEmptyTemple())

  function updateField(event) {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'district' ? { loginId: createTempleLoginId(value) } : {}),
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    await onSave(form)
  }

  return (
    <section className="rounded-lg border border-[#D4A017]/18 bg-white p-6 shadow-[0_18px_54px_rgba(11,31,58,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-[#9C7414]">
            Temple Registry
          </p>
          <h2 className="font-display mt-2 text-3xl font-semibold">
            {editingTemple ? 'Edit Temple' : 'Add Temple'}
          </h2>
        </div>
        {editingTemple ? (
          <button
            type="button"
            onClick={onCancel}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-[#D4A017]/24 text-[#0B1F3A] transition hover:bg-[#EFE6D3]"
            aria-label="Cancel editing"
          >
            <X size={18} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
        <label className="block rounded-lg border border-[#D4A017]/18 bg-[#EFE6D3]/55 p-4">
          <span className="flex items-center gap-2 text-sm font-semibold text-[#9C7414]">
            <KeyRound size={16} aria-hidden="true" />
            Temple Login ID
          </span>
          <input
            name="loginId"
            value={form.loginId}
            className="mt-3 min-h-12 w-full rounded-md border border-[#D4A017]/22 bg-white px-4 font-mono text-lg font-semibold text-[#0B1F3A] outline-none"
            readOnly
          />
          <p className="mt-2 text-sm leading-6 text-[#42516A]">
            This login ID is automatically generated from the selected district
            and saved with the temple record.
          </p>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-[#253A58]">
            Temple Name
          </span>
          <input
            name="name"
            value={form.name}
            onChange={updateField}
            className={inputClass}
            placeholder="Eg: Sree Dharma Sastha Temple"
            required
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-[#253A58]">
              Main Deity
            </span>
            <input
              name="deity"
              value={form.deity}
              onChange={updateField}
              className={inputClass}
              placeholder="Eg: Lord Ayyappa"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-[#253A58]">
              District
            </span>
            <select
              name="district"
              value={form.district}
              onChange={updateField}
              className={inputClass}
            >
              {districts.map((district) => (
                <option key={district}>{district}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-[#253A58]">
              Plan
            </span>
            <select
              name="plan"
              value={form.plan}
              onChange={updateField}
              className={inputClass}
            >
              {plans.map((plan) => (
                <option key={plan}>{plan}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-[#253A58]">Status</span>
            <select
              name="status"
              value={form.status}
              onChange={updateField}
              className={inputClass}
            >
              {statuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-semibold text-[#253A58]">
            Contact Number
          </span>
          <input
            name="contact"
            value={form.contact}
            onChange={updateField}
            className={inputClass}
            placeholder="Eg: +91 98765 43210"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-[#253A58]">
            Temple Notes
          </span>
          <textarea
            name="description"
            value={form.description}
            onChange={updateField}
            className={`${inputClass} min-h-32 resize-none py-3 leading-6`}
            placeholder="Add administration notes, enabled modules, or onboarding details..."
            required
          />
        </label>

        {saveError ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {saveError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSaving}
          className="flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#0B1F3A] px-5 py-3 font-semibold text-[#F8F6F0] shadow-[0_16px_44px_rgba(11,31,58,0.18)] transition hover:bg-[#123761] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Save size={18} aria-hidden="true" />
          {isSaving
            ? 'Saving Temple...'
            : editingTemple
              ? 'Update Temple'
              : 'Add Temple'}
        </button>
      </form>
    </section>
  )
}
