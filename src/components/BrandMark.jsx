import logo from '../assets/logo.png'

export default function BrandMark({
  compact = false,
  showText = true,
  className = '',
}) {
  const logoSize = compact ? 'h-11 w-11' : 'h-28 w-28 sm:h-36 sm:w-36'

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={logo}
        className={`${logoSize} shrink-0 rounded-lg object-contain shadow-[0_18px_55px_rgba(212,160,23,0.22)]`}
        alt="THEERTHA logo"
      />
      {showText ? (
        <div className="text-left">
          <p className="font-display text-xl font-semibold leading-none text-[#F8F6F0] sm:text-2xl">
            THEERTHA
          </p>
          <p className="mt-1 text-[11px] font-semibold uppercase text-[#D4A017]">
            Temple Management Software
          </p>
        </div>
      ) : null}
    </div>
  )
}
