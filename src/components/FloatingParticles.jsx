import { motion } from 'framer-motion'

const particles = Array.from({ length: 30 }, (_, index) => ({
  id: index,
  left: `${(index * 31) % 100}%`,
  top: `${(index * 47) % 100}%`,
  size: 3 + (index % 4),
  delay: (index % 8) * 0.35,
  duration: 6 + (index % 6),
}))

export default function FloatingParticles() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="absolute rounded-full bg-[#D4A017] shadow-[0_0_22px_rgba(212,160,23,0.9)]"
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            opacity: [0.12, 0.78, 0.16],
            y: [0, -38, 0],
            scale: [1, 1.65, 1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: particle.delay,
          }}
        />
      ))}
    </div>
  )
}
