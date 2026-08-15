import { useMouseTrack } from '@/hooks/useMouseTrack'
import { features } from '@/data/features'
import { featureIcons } from '@/icons/featureIcons'
import type { Feature } from '@/data/types'
import '@/styles/Features.css'

function FeatureCard({ id, title, description }: Feature) {
  const cardRef = useMouseTrack<HTMLDivElement>()
  return (
    <div ref={cardRef} className="features__card reveal">
      <div className="features__icon">{featureIcons[id]}</div>
      <h3 className="features__card-title">{title}</h3>
      <p className="features__card-desc">{description}</p>
    </div>
  )
}

function Features() {
  return (
    <section id="features" className="features" aria-labelledby="features-title">
      <div className="container">
        <h2 className="section-title" id="features-title">
          Why Knot?
        </h2>
        <p className="section-subtitle">
          Purpose-built for AI agents that need deep codebase understanding — not just text search.
        </p>

        <div className="features__grid">
          {features.map((f) => (
            <FeatureCard key={f.id} {...f} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features
