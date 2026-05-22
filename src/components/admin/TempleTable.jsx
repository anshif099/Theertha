import { Edit3, PlusCircle, Search, Trash2 } from 'lucide-react'

function statusClass(status) {
  if (status === 'Active') {
    return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
  }

  if (status === 'Paused') {
    return 'bg-slate-100 text-slate-600 ring-slate-200'
  }

  return 'bg-amber-50 text-amber-700 ring-amber-200'
}

export default function TempleTable({
  onDelete,
  onEdit,
  onSearchChange,
  search,
  temples,
}) {
  return (
    <section className="rounded-lg border border-[#D4A017]/18 bg-white shadow-[0_18px_54px_rgba(11,31,58,0.08)]">
      <div className="border-b border-[#EFE6D3] p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-[#9C7414]">
              Manage Temples
            </p>
            <h2 className="font-display mt-2 text-3xl font-semibold">
              Temple Directory
            </h2>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <label className="relative block w-full sm:w-72">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#42516A]"
                size={18}
                aria-hidden="true"
              />
              <input
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                className="min-h-12 w-full rounded-md border border-[#D4A017]/22 bg-[#F8F6F0] pl-11 pr-4 text-[#0B1F3A] outline-none transition placeholder:text-[#42516A]/52 focus:border-[#D4A017] focus:bg-white"
                placeholder="Search temples"
              />
            </label>
            <a
              href="/superadmin/temples/new"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#0B1F3A] px-5 py-3 text-sm font-semibold text-[#F8F6F0] shadow-[0_14px_36px_rgba(11,31,58,0.18)] transition hover:bg-[#123761]"
            >
              <PlusCircle size={18} aria-hidden="true" />
              Register Temple
            </a>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[#EFE6D3] bg-[#F8F6F0] text-sm text-[#42516A]">
              <th className="px-6 py-4 font-semibold">Temple</th>
              <th className="px-6 py-4 font-semibold">Login ID</th>
              <th className="px-6 py-4 font-semibold">Deity</th>
              <th className="px-6 py-4 font-semibold">District</th>
              <th className="px-6 py-4 font-semibold">Plan</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Updated</th>
              <th className="px-6 py-4 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {temples.map((temple) => (
              <tr
                key={temple.id}
                className="border-b border-[#EFE6D3] align-top transition hover:bg-[#F8F6F0]"
              >
                <td className="px-6 py-5">
                  <p className="font-display text-xl font-semibold text-[#0B1F3A]">
                    {temple.name}
                  </p>
                  <p className="mt-2 max-w-md text-sm leading-6 text-[#42516A]">
                    {temple.description}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#9C7414]">
                    {temple.contact}
                  </p>
                </td>
                <td className="px-6 py-5">
                  <span className="inline-flex rounded-md bg-[#EFE6D3] px-3 py-2 font-mono text-sm font-semibold text-[#0B1F3A] ring-1 ring-[#D4A017]/22">
                    {temple.loginId}
                  </span>
                </td>
                <td className="px-6 py-5 text-sm font-semibold text-[#253A58]">
                  {temple.deity}
                </td>
                <td className="px-6 py-5 text-sm text-[#42516A]">
                  {temple.district}
                </td>
                <td className="px-6 py-5 text-sm text-[#42516A]">
                  {temple.plan}
                </td>
                <td className="px-6 py-5">
                  <span
                    className={`inline-flex rounded-md px-3 py-1 text-xs font-bold ring-1 ${statusClass(
                      temple.status,
                    )}`}
                  >
                    {temple.status}
                  </span>
                </td>
                <td className="px-6 py-5 text-sm text-[#42516A]">
                  {temple.updatedAt}
                </td>
                <td className="px-6 py-5">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(temple)}
                      className="flex h-10 w-10 items-center justify-center rounded-md border border-[#D4A017]/24 text-[#0B1F3A] transition hover:bg-[#EFE6D3]"
                      aria-label={`Edit ${temple.name}`}
                    >
                      <Edit3 size={17} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(temple.id)}
                      className="flex h-10 w-10 items-center justify-center rounded-md border border-red-200 text-red-600 transition hover:bg-red-50"
                      aria-label={`Delete ${temple.name}`}
                    >
                      <Trash2 size={17} aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!temples.length ? (
              <tr>
                <td
                  colSpan="8"
                  className="px-6 py-14 text-center text-[#42516A]"
                >
                  No temples found. Add a new temple or adjust your search.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  )
}
