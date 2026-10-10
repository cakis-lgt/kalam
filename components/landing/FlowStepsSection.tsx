const FLOW_STEPS = [
  {
    n: "01",
    title: "Register & sign in",
    desc: "Create a candidate account, verify your email, then access your dashboard.",
  },
  {
    n: "02",
    title: "Check your device",
    desc: "Make sure your camera, microphone, and face detection are ready before the test.",
  },
  {
    n: "03",
    title: "Take the test",
    desc: "Answer adaptive ALIKHTIBAR prompts in Arabic or English. Recording starts automatically with gaze monitoring.",
  },
  {
    n: "04",
    title: "Get examiner scores",
    desc: "An examiner reviews your recording. Results appear on your dashboard in real time.",
  },
] as const;

export function FlowStepsSection() {
  return (
    <section className="bg-page pb-14 pt-8">
      <div className="mx-auto max-w-container-max px-margin-mobile md:px-gutter">
        <p className="mb-[26px] text-center font-heading text-sm font-semibold tracking-[0.05em] text-ink-faint">
          FOUR STEPS
        </p>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {FLOW_STEPS.map(({ n, title, desc }) => (
            <div
              key={n}
              className="relative rounded-[14px] border border-border bg-page-alt p-5"
            >
              <div className="mb-2 font-heading text-[30px] font-semibold text-primary-fixed-dim">
                {n}
              </div>
              <div className="mb-[5px] text-[14.5px] font-semibold text-ink">
                {title}
              </div>
              <p className="text-[13px] leading-[1.5] text-ink-subtle">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
