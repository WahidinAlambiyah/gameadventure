type PlaceholderPageProps = {
  title: string;
  description: string;
  actions?: React.ReactNode;
};

export function PlaceholderPage({ title, description, actions }: PlaceholderPageProps) {
  return (
    <main className="page-shell py-10">
      <section className="surface p-6">
        <h1 className="text-3xl font-black">{title}</h1>
        <p className="mt-3 max-w-3xl leading-7 text-[var(--muted)]">{description}</p>
        {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
      </section>
    </main>
  );
}
