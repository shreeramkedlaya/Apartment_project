/** Generic placeholder used for pages not yet implemented. */
export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-20 fade-up">
      <h2 className="text-xl font-display font-semibold text-text mb-2">{title}</h2>
      <p className="text-sm text-text-muted">This screen is under construction. Come back soon!</p>
      <div className="mt-6 h-32 skeleton" />
      <div className="mt-3 h-20 skeleton" />
      <div className="mt-3 h-20 skeleton" />
    </div>
  );
}
