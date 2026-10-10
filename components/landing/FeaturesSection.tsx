const VALUE_PROPS = [
  {
    icon: "📋",
    title: "ALIKHTIBAR Standard",
    desc: "Six-dimension rubric (Pre-A1–C2) aligned with institutional Arabic and English language assessment practice.",
  },
  {
    icon: "🎥",
    title: "Self-Paced Video Test",
    desc: "Record answers from your room. Gaze monitoring maintains integrity without an examiner in the same space.",
  },
  {
    icon: "🧑‍🏫",
    title: "Human Examiner Scoring",
    desc: "Every session is reviewed by experienced examiners. Final scores are not AI-generated — AI only assists transcription when enabled.",
  },
] as const;

export function FeaturesSection() {
  return (
    <section id="about" className="bg-page">
      <div className="mx-auto max-w-container-max px-margin-mobile pb-6 pt-10 md:px-gutter">
        <div className="grid grid-cols-1 gap-[18px] md:grid-cols-3">
          {VALUE_PROPS.map(({ icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-white p-6"
            >
              <div className="mb-3.5 flex h-[42px] w-[42px] items-center justify-center rounded-[11px] bg-primary-container text-xl">
                {icon}
              </div>
              <h3 className="mb-[7px] font-heading text-lg font-semibold text-ink">
                {title}
              </h3>
              <p className="text-sm leading-[1.55] text-ink-muted">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
