import { CheckCircle2, FlaskConical, Info, ShieldAlert, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export interface CropAIAnalysis {
  diagnosis: string
  confidence: 'high' | 'medium' | 'low'
  medicine_guidance: string
  application_guidance: string
  crop_care: string[]
  when_to_escalate: string
  disclaimer: string
}

const FALLBACK_DISCLAIMER = 'AI guidance is informational and not a confirmed diagnosis or prescription. Confirm the problem with a local agronomist and follow the label of any locally registered product.'

const LEGACY_GUIDANCE: Record<string, Pick<CropAIAnalysis, 'medicine_guidance' | 'application_guidance' | 'crop_care'>> = {
  leaf_disease: {
    medicine_guidance: 'If a local expert confirms fungal disease, ask for a locally registered fungicide suitable for this crop and pathogen.',
    application_guidance: 'Use only the product and crop combination listed on the label. Do not mix products or use a made-up dose.',
    crop_care: ['Remove severely affected leaves where practical.', 'Improve airflow and field drainage.', 'Water at soil level and avoid wetting foliage.', 'Check nearby plants for the same symptoms.'],
  },
  pest_attack: {
    medicine_guidance: 'Start with physical or biological controls. If treatment is still needed, ask for a locally registered product for the confirmed pest and crop.',
    application_guidance: 'Follow the product label and protect pollinators and beneficial insects.',
    crop_care: ['Inspect both sides of leaves and new growth.', 'Remove heavily affected plant parts.', 'Keep weeds and crop debris under control.', 'Recheck the crop after 2-3 days.'],
  },
  nutrient_deficiency: {
    medicine_guidance: 'Do not use a pesticide for a suspected deficiency. Get a soil or leaf test before choosing fertilizer or foliar feed.',
    application_guidance: 'Use only a crop-appropriate, locally recommended fertilizer and follow its label or agronomist guidance.',
    crop_care: ['Check soil moisture and root health.', 'Review recent fertilizer and irrigation history.', 'Compare new and older leaves.', 'Test soil or leaf tissue before applying corrective nutrients.'],
  },
  weather_damage: {
    medicine_guidance: 'There is no guaranteed medicine for weather damage. Avoid unnecessary pesticide or fertilizer while the crop is stressed.',
    application_guidance: 'Stabilize water and drainage first, then ask a local expert before applying any recovery product.',
    crop_care: ['Remove unsafe or fully dead plant material.', 'Improve drainage after heavy rain.', 'Provide shade or wind protection where practical.', 'Monitor new growth before taking further action.'],
  },
}

export function parseAIRecommendation(value?: string | null, issueType = 'other'): CropAIAnalysis | null {
  if (!value?.trim()) return null
  try {
    const parsed = JSON.parse(value) as Partial<CropAIAnalysis>
    const care = Array.isArray(parsed.crop_care) ? parsed.crop_care.map(String).filter(Boolean) : []
    return {
      diagnosis: String(parsed.diagnosis || value),
      confidence: parsed.confidence === 'high' || parsed.confidence === 'low' ? parsed.confidence : 'medium',
      medicine_guidance: String(parsed.medicine_guidance || 'Ask a local agronomist to confirm the cause before applying treatment.'),
      application_guidance: String(parsed.application_guidance || 'Use only a locally registered product and follow its label exactly.'),
      crop_care: care.length ? care : ['Monitor the crop closely and record how the symptoms change.'],
      when_to_escalate: String(parsed.when_to_escalate || 'Contact a local agronomist if symptoms spread or the crop is under visible stress.'),
      disclaimer: String(parsed.disclaimer || FALLBACK_DISCLAIMER),
    }
  } catch {
    const legacy = LEGACY_GUIDANCE[issueType] ?? {
      medicine_guidance: 'Do not apply a pesticide or fertilizer based only on this report. Ask a local agronomist to identify the cause.',
      application_guidance: 'Use only locally registered products and follow the product label exactly if an expert recommends treatment.',
      crop_care: ['Monitor nearby plants for the same symptoms.', 'Improve airflow, drainage, and field hygiene where practical.'],
    }
    return {
      diagnosis: value.replace(/^\[AI analysis, .*?\]\s*/i, ''),
      confidence: 'medium',
      ...legacy,
      when_to_escalate: 'Contact a local agronomist if symptoms spread or the crop is rapidly declining.',
      disclaimer: FALLBACK_DISCLAIMER,
    }
  }
}

const confidenceVariant = (confidence: CropAIAnalysis['confidence']) => {
  if (confidence === 'high') return 'success' as const
  if (confidence === 'low') return 'warning' as const
  return 'ecom' as const
}

export function AIRecommendationCard({ value, issueType = 'other', compact = false }: { value?: string | null; issueType?: string; compact?: boolean }) {
  const analysis = parseAIRecommendation(value, issueType)
  if (!analysis) return null

  if (compact) {
    return (
      <div className="rounded-2xl border border-(--color-agri-primary)/15 bg-(--color-agri-primary)/6 p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-(--color-agri-primary)"><Sparkles size={13} /> AI guidance</span>
          <Badge variant={confidenceVariant(analysis.confidence)}>{analysis.confidence} confidence</Badge>
        </div>
        <p className="mt-2 line-clamp-2 text-xs leading-5">{analysis.diagnosis}</p>
        <p className="mt-2 line-clamp-2 text-[11px] text-(--color-muted)"><span className="font-semibold text-(--color-text)">Treatment:</span> {analysis.medicine_guidance}</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-(--color-agri-primary)/20 bg-(--color-surface) shadow-[0_18px_50px_-35px_rgba(24,91,53,0.55)]">
      <div className="flex items-start justify-between gap-4 border-b border-(--color-border) bg-(--color-agri-primary)/6 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-(--color-agri-primary) text-white shadow-sm"><Sparkles size={17} /></span>
          <div>
            <p className="text-sm font-semibold">AI crop guidance</p>
            <p className="mt-0.5 text-xs text-(--color-muted)">Photo and issue details reviewed</p>
          </div>
        </div>
        <Badge variant={confidenceVariant(analysis.confidence)}>{analysis.confidence} confidence</Badge>
      </div>

      <div className="grid gap-3 p-4 sm:p-5">
        <section className="rounded-2xl bg-(--color-surface-2) p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-(--color-muted)">Assessment</p>
          <p className="mt-2 text-sm leading-6">{analysis.diagnosis}</p>
        </section>

        <div className="grid gap-3 md:grid-cols-2">
          <section className="rounded-2xl border border-(--color-agri-primary)/15 bg-(--color-agri-primary)/6 p-4">
            <p className="flex items-center gap-2 text-xs font-semibold text-(--color-agri-primary)"><FlaskConical size={15} /> Treatment / medicine guidance</p>
            <p className="mt-2 text-sm leading-6">{analysis.medicine_guidance}</p>
            <p className="mt-3 border-t border-(--color-agri-primary)/15 pt-3 text-xs leading-5 text-(--color-muted)">{analysis.application_guidance}</p>
          </section>

          <section className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4">
            <p className="flex items-center gap-2 text-xs font-semibold"><CheckCircle2 size={15} className="text-(--color-agri-primary)" /> Crop care plan</p>
            <ul className="mt-2 space-y-2">
              {analysis.crop_care.map((step, index) => (
                <li key={`${step}-${index}`} className="flex gap-2 text-sm leading-5 text-(--color-muted)">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-(--color-agri-primary)" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="rounded-2xl bg-(--color-warning)/10 p-4">
          <p className="flex items-center gap-2 text-xs font-semibold text-(--color-warning)"><Info size={15} /> When to get help</p>
          <p className="mt-2 text-sm leading-5">{analysis.when_to_escalate}</p>
        </section>

        <section className="flex items-start gap-2.5 rounded-2xl border border-(--color-danger)/15 bg-(--color-danger)/5 p-4">
          <ShieldAlert size={16} className="mt-0.5 flex-shrink-0 text-(--color-danger)" />
          <p className="text-xs leading-5 text-(--color-muted)"><span className="font-semibold text-(--color-text)">Safety disclaimer:</span> {analysis.disclaimer}</p>
        </section>
      </div>
    </div>
  )
}
