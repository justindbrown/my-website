type NotifyVariantOption = {
  id: string;
  label: string;
};

type NotifyMeFormProps = {
  slug: string;
  returnTo: string;
  variants: NotifyVariantOption[];
};

export default function NotifyMeForm({ slug, returnTo, variants }: NotifyMeFormProps) {
  return (
    <form action="/api/notify" method="post" className="space-y-3">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="returnTo" value={returnTo} />

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
          Email
        </label>
        <input
          type="email"
          name="email"
          required
          placeholder="you@example.com"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
        />
      </div>

      {variants.length > 0 ? (
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
            Variant
          </label>
          <select
            name="variantId"
            defaultValue={variants[0].id}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
          >
            {variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <button
        type="submit"
        className="w-full rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
      >
        Notify Me When Available
      </button>
    </form>
  );
}
