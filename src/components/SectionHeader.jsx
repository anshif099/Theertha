import Reveal from './Reveal.jsx'

export default function SectionHeader({
  eyebrow,
  title,
  copy,
  inverse = false,
  centered = true,
}) {
  return (
    <Reveal
      className={`mx-auto max-w-3xl ${centered ? 'text-center' : 'text-left'}`}
    >
      <p
        className={`text-sm font-semibold uppercase ${
          inverse ? 'text-[#F7D77C]' : 'text-[#9C7414]'
        }`}
      >
        {eyebrow}
      </p>
      <h2
        className={`font-display mt-4 text-4xl font-semibold leading-tight sm:text-5xl ${
          inverse ? 'text-[#F8F6F0]' : 'text-[#0B1F3A]'
        }`}
      >
        {title}
      </h2>
      <p
        className={`mt-5 text-lg leading-8 ${
          inverse ? 'text-[#EFE6D3]/82' : 'text-[#42516A]'
        }`}
      >
        {copy}
      </p>
    </Reveal>
  )
}
