"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { categories, storageTypes } from "@/config/categories";
import { ProductImage } from "@/components/product-image";

export interface ProductFormInitial {
  id?: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  packSize: string;
  unitsPerCase: number;
  casePriceCents: number;
  storage: string;
  imageUrl: string | null;
  active: boolean;
  quantityOnHand: number;
  reorderPoint: number;
  binLocation: string | null;
}

const blank: ProductFormInitial = {
  sku: "", name: "", description: "", category: "dairy", brand: "", packSize: "", unitsPerCase: 1,
  casePriceCents: 0, storage: "refrigerated", imageUrl: null, active: true, quantityOnHand: 0, reorderPoint: 0, binLocation: "",
};

/** Add / edit a product. Catalog fields go to Firestore, stock fields go to Cloud SQL. */
export function ProductForm({ initial, storageConfigured }: { initial?: ProductFormInitial; storageConfigured: boolean }) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState<ProductFormInitial>(initial ?? blank);
  const [priceDollars, setPriceDollars] = useState(((initial?.casePriceCents ?? 0) / 100).toFixed(2));
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const update = <K extends keyof ProductFormInitial>(key: K, value: ProductFormInitial[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      let imageUrl = form.imageUrl;
      if (photo) {
        const fd = new FormData();
        fd.append("file", photo);
        fd.append("name", form.name || form.sku);
        const up = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const upData = await up.json();
        if (!up.ok) throw new Error(upData.error ?? "Photo upload failed.");
        imageUrl = upData.url;
      }
      const payload = {
        ...form,
        imageUrl,
        casePriceCents: Math.round(Number(priceDollars) * 100),
        binLocation: form.binLocation || null,
      };
      const res = await fetch(isEdit ? `/api/admin/products/${initial!.id}` : "/api/admin/products", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const detail = data.issues?.map((i: { path: string; message: string }) => `${i.path}: ${i.message}`).join("; ");
        throw new Error(detail || data.error || "Save failed.");
      }
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!initial?.id || !confirm(`Delete "${form.name}"? This cannot be undone.`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/products/${initial.id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Delete failed.");
      setBusy(false);
      return;
    }
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="card space-y-4">
        <h2 className="font-semibold">Product details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="name">Product name</label>
            <input id="name" className="input" required value={form.name} onChange={(e) => update("name", e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="sku">SKU</label>
            <input id="sku" className="input" required value={form.sku} onChange={(e) => update("sku", e.target.value)} placeholder="DAI-1004" />
          </div>
          <div>
            <label className="label" htmlFor="brand">Brand</label>
            <input id="brand" className="input" value={form.brand} onChange={(e) => update("brand", e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="category">Category</label>
            <select id="category" className="input" value={form.category} onChange={(e) => update("category", e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="storage">Storage</label>
            <select id="storage" className="input" value={form.storage} onChange={(e) => update("storage", e.target.value)}>
              {storageTypes.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="packSize">Pack size</label>
            <input id="packSize" className="input" required value={form.packSize} onChange={(e) => update("packSize", e.target.value)} placeholder="12 × 32 oz" />
          </div>
          <div>
            <label className="label" htmlFor="unitsPerCase">Units per case</label>
            <input id="unitsPerCase" type="number" min={1} className="input" value={form.unitsPerCase} onChange={(e) => update("unitsPerCase", Number(e.target.value))} />
          </div>
          <div>
            <label className="label" htmlFor="price">Case price (USD)</label>
            <input id="price" type="number" min={0} step="0.01" className="input" required value={priceDollars} onChange={(e) => setPriceDollars(e.target.value)} />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.active} onChange={(e) => update("active", e.target.checked)} />
              Visible in the catalog
            </label>
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="description">Description</label>
            <textarea id="description" rows={4} className="input" value={form.description} onChange={(e) => update("description", e.target.value)} />
          </div>
        </div>

        <h2 className="pt-2 font-semibold">Stock</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="qty">Cases on hand</label>
            <input id="qty" type="number" min={0} className="input" value={form.quantityOnHand} onChange={(e) => update("quantityOnHand", Number(e.target.value))} />
          </div>
          <div>
            <label className="label" htmlFor="reorder">Low-stock alert at</label>
            <input id="reorder" type="number" min={0} className="input" value={form.reorderPoint} onChange={(e) => update("reorderPoint", Number(e.target.value))} />
          </div>
          <div>
            <label className="label" htmlFor="bin">Warehouse bin</label>
            <input id="bin" className="input" value={form.binLocation ?? ""} onChange={(e) => update("binLocation", e.target.value)} placeholder="C-04" />
          </div>
        </div>

        {error && <p className="alert-error">{error}</p>}
        <div className="flex flex-wrap gap-3 pt-2">
          <button type="submit" disabled={busy} className="btn-primary">{busy ? "Saving…" : isEdit ? "Save changes" : "Add product"}</button>
          <button type="button" onClick={() => router.push("/admin/products")} className="btn-secondary">Cancel</button>
          {isEdit && (
            <button type="button" onClick={onDelete} disabled={busy} className="btn-danger ml-auto">Delete product</button>
          )}
        </div>
      </div>

      <aside className="card space-y-3 h-fit">
        <h2 className="font-semibold">Photo</h2>
        <ProductImage src={photo ? URL.createObjectURL(photo) : form.imageUrl} category={form.category} alt="" size={260} className="w-full" />
        {storageConfigured ? (
          <>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} className="text-sm" />
            <p className="text-xs text-neutral-500">JPEG, PNG or WebP up to 5 MB. Uploaded to Cloud Storage when you save.</p>
            {form.imageUrl && (
              <button type="button" onClick={() => { update("imageUrl", null); setPhoto(null); }} className="text-xs text-red-600 hover:underline">
                Remove photo
              </button>
            )}
          </>
        ) : (
          <p className="text-xs text-neutral-500">Photo uploads are disabled until GCS_BUCKET is configured.</p>
        )}
      </aside>
    </form>
  );
}
