"use client";

import Image from "@/components/ui/product-image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ArrowLeft, ExternalLink, ImagePlus, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { saveProduct, uploadImage, type ProductPayload } from "@/app/actions/admin";
import { DeleteProductButton } from "@/components/admin/delete-product";
import { Button } from "@/components/ui/button";
import type { Category, ProductDetail } from "@/lib/types";
import { cn } from "@/lib/utils";

const toDollars = (c?: number | null) => (c == null ? "" : (c / 100).toFixed(2));
const toCents = (s: string) => (s.trim() === "" ? null : Math.round(parseFloat(s) * 100));

export function ProductForm({ categories, product }: { categories: Category[]; product?: ProductDetail }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [uploading, startUpload] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const [f, setF] = useState({
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    tagline: product?.tagline ?? "",
    description: product?.description ?? "",
    price: toDollars(product?.price),
    compareAtPrice: toDollars(product?.compareAtPrice),
    size: product?.size ?? "",
    stock: String(product?.stock ?? 100),
    featured: product?.featured ?? false,
    isActive: product?.isActive ?? true,
  });
  const [gallery, setGallery] = useState<string[]>(product?.gallery?.length ? product.gallery : product ? [product.image] : []);
  const [cats, setCats] = useState<string[]>(product?.categories.map((c) => c.id) ?? []);
  const [ingredients, setIngredients] = useState(product?.ingredients ?? [{ name: "", detail: "" }]);
  const [benefits, setBenefits] = useState(product?.benefits ?? [""]);
  const [howToUse, setHowToUse] = useState(product?.howToUse ?? [""]);
  const [faqs, setFaqs] = useState(product?.faqs ?? []);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const submit = () => {
    const price = toCents(f.price);
    if (price == null || price < 0) return toast.error("Enter a valid price");
    if (gallery.length === 0) return toast.error("Add at least one image");
    const payload: ProductPayload = {
      name: f.name,
      slug: f.slug || undefined,
      tagline: f.tagline || null,
      description: f.description,
      price,
      compareAtPrice: toCents(f.compareAtPrice),
      image: gallery[0],
      gallery,
      ingredients: ingredients.filter((i) => i.name.trim()),
      benefits: benefits.map((b) => b.trim()).filter(Boolean),
      howToUse: howToUse.map((b) => b.trim()).filter(Boolean),
      faqs: faqs.filter((q) => q.q.trim() && q.a.trim()),
      size: f.size || null,
      stock: Math.max(0, parseInt(f.stock) || 0),
      featured: f.featured,
      isActive: f.isActive,
      categoryIds: cats,
    };
    start(async () => {
      const res = await saveProduct(payload, product?.id);
      if (res.ok) {
        toast.success(product ? "Product updated" : "Product created");
        if (!product) router.push(`/admin/products/${res.data.id}`);
        else router.refresh();
      } else toast.error(res.error);
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink">
          <ArrowLeft className="size-4" /> Products
        </Link>
        <div className="ml-auto flex items-center gap-2">
          {product && (
            <>
              <Link href={`/product/${product.slug}`} target="_blank" className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm hover:bg-ink hover:text-white">
                <ExternalLink className="size-4" /> View in store
              </Link>
              <DeleteProductButton id={product.id} name={product.name} redirectTo="/admin/products" />
            </>
          )}
          <Button disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />} {product ? "Save changes" : "Create product"}
          </Button>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card title="Basics">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="label">Name</span>
                <input className="input" required minLength={2} value={f.name} onChange={set("name")} />
              </label>
              <label>
                <span className="label">URL slug (auto from name if empty)</span>
                <input className="input font-mono text-sm" value={f.slug} onChange={set("slug")} placeholder="vitamin-c-face-serum" />
              </label>
              <label>
                <span className="label">Size</span>
                <input className="input" value={f.size} onChange={set("size")} placeholder="30 ml / 1.01 fl oz" />
              </label>
              <label className="sm:col-span-2">
                <span className="label">Tagline</span>
                <input className="input" value={f.tagline} onChange={set("tagline")} />
              </label>
              <label className="sm:col-span-2">
                <span className="label">Description</span>
                <textarea className="input min-h-32" required minLength={10} value={f.description} onChange={set("description")} />
              </label>
            </div>
          </Card>

          <Card title="Key ingredients">
            <div className="space-y-3">
              {ingredients.map((ing, i) => (
                <div key={i} className="flex gap-2">
                  <input className="input w-1/3" placeholder="Ingredient" value={ing.name} onChange={(e) => setIngredients(ingredients.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                  <input className="input flex-1" placeholder="What it does" value={ing.detail} onChange={(e) => setIngredients(ingredients.map((x, j) => (j === i ? { ...x, detail: e.target.value } : x)))} />
                  <RemoveBtn onClick={() => setIngredients(ingredients.filter((_, j) => j !== i))} />
                </div>
              ))}
              <AddBtn onClick={() => setIngredients([...ingredients, { name: "", detail: "" }])}>Add ingredient</AddBtn>
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Benefits (“Helps to”)">
              <StringList items={benefits} setItems={setBenefits} placeholder="e.g. Evens the skin tone" />
            </Card>
            <Card title="How to use">
              <StringList items={howToUse} setItems={setHowToUse} placeholder="Step" numbered />
            </Card>
          </div>

          <Card title="FAQs">
            <div className="space-y-3">
              {faqs.map((q, i) => (
                <div key={i} className="flex gap-2 rounded-2xl bg-cream p-3">
                  <div className="flex-1 space-y-2">
                    <input className="input" placeholder="Question" value={q.q} onChange={(e) => setFaqs(faqs.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))} />
                    <textarea className="input" placeholder="Answer" value={q.a} onChange={(e) => setFaqs(faqs.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))} />
                  </div>
                  <RemoveBtn onClick={() => setFaqs(faqs.filter((_, j) => j !== i))} />
                </div>
              ))}
              <AddBtn onClick={() => setFaqs([...faqs, { q: "", a: "" }])}>Add FAQ</AddBtn>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Images">
            <div className="grid grid-cols-3 gap-3">
              {gallery.map((src, i) => (
                <div key={src + i} className={cn("group relative aspect-square overflow-hidden rounded-2xl bg-sand", i === 0 && "ring-2 ring-ink")}>
                  <Image src={src} alt="" fill sizes="120px" className="object-cover" />
                  {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-ink px-2 py-0.5 text-[10px] text-white">Main</span>}
                  <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between opacity-0 transition group-hover:opacity-100">
                    {i > 0 && (
                      <button type="button" onClick={() => setGallery([src, ...gallery.filter((_, j) => j !== i)])} className="rounded-full bg-white px-2 py-0.5 text-[10px]">
                        Make main
                      </button>
                    )}
                    <button type="button" onClick={() => setGallery(gallery.filter((_, j) => j !== i))} className="ml-auto grid size-6 place-items-center rounded-full bg-white text-red-600" aria-label="Remove image">
                      <X className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="grid aspect-square place-items-center rounded-2xl border-2 border-dashed border-line text-mute transition hover:border-ink hover:text-ink"
              >
                {uploading ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-6" />}
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const fd = new FormData();
                fd.set("file", file);
                startUpload(async () => {
                  const res = await uploadImage(fd);
                  if (res.ok) setGallery((g) => [...g, res.data.url]);
                  else toast.error(res.error);
                });
                e.target.value = "";
              }}
            />
            <p className="mt-3 text-xs text-mute">JPG, PNG, WEBP or AVIF up to 5 MB. Square images look best.</p>
          </Card>

          <Card title="Pricing & inventory">
            <div className="grid grid-cols-2 gap-4">
              <label>
                <span className="label">Price (USD)</span>
                <input className="input" type="number" min="0" step="0.01" required value={f.price} onChange={set("price")} />
              </label>
              <label>
                <span className="label">Compare-at price</span>
                <input className="input" type="number" min="0" step="0.01" value={f.compareAtPrice} onChange={set("compareAtPrice")} placeholder="Optional" />
              </label>
              <label className="col-span-2">
                <span className="label">Stock</span>
                <input className="input" type="number" min="0" value={f.stock} onChange={set("stock")} />
              </label>
            </div>
          </Card>

          <Card title="Visibility">
            <Toggle label="Active (visible in store)" checked={f.isActive} onChange={(v) => setF({ ...f, isActive: v })} />
            <Toggle label="Featured (bestsellers on home page)" checked={f.featured} onChange={(v) => setF({ ...f, featured: v })} />
          </Card>

          <Card title="Concerns">
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => {
                const on = cats.includes(c.id);
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setCats(on ? cats.filter((x) => x !== c.id) : [...cats, c.id])}
                    className={cn("rounded-full border px-3.5 py-1.5 text-sm transition", on ? "border-ink bg-ink text-white" : "border-line hover:border-ink")}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-6">
      <h3 className="mb-4 font-display text-lg">{title}</h3>
      {children}
    </section>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between py-2 text-sm">
      {label}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("relative h-6 w-11 rounded-full transition-colors", checked ? "bg-ink" : "bg-line")}
      >
        <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-all", checked ? "left-[22px]" : "left-0.5")} />
      </button>
    </label>
  );
}

function StringList({ items, setItems, placeholder, numbered }: { items: string[]; setItems: (v: string[]) => void; placeholder: string; numbered?: boolean }) {
  return (
    <div className="space-y-2">
      {items.map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          {numbered && <span className="w-5 text-sm text-mute">{i + 1}.</span>}
          <input className="input" placeholder={placeholder} value={v} onChange={(e) => setItems(items.map((x, j) => (j === i ? e.target.value : x)))} />
          <RemoveBtn onClick={() => setItems(items.filter((_, j) => j !== i))} />
        </div>
      ))}
      <AddBtn onClick={() => setItems([...items, ""])}>Add</AddBtn>
    </div>
  );
}

function AddBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
      <Plus className="size-4" /> {children}
    </button>
  );
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label="Remove" className="grid size-10 shrink-0 place-items-center rounded-full text-mute transition hover:bg-red-50 hover:text-red-600">
      <X className="size-4" />
    </button>
  );
}
