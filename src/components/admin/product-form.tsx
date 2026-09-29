"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { UNITS_OF_MEASURE } from "@/config/catalog";
import { normalizeSkuToId, skuFromId } from "@/lib/sku";
import { ProductImage } from "@/components/product-image";

export interface ProductFormInitial {
  id?: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  unitOfMeasure: string;
  priceCents: number;
  imageUrl: string | null;
  active: boolean;
  quantityOnHand: number;
  reorderPoint: number;
  binLocation: string | null;
}

export interface CategoryOption {
  id: string;
  name: string;
}

interface Props {
  initial?: ProductFormInitial;
  categories: CategoryOption[];
}

async function readJson(res: Response): Promise<{ error?: string; warning?: string; issues?: { path: string; message: string }[] }> {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

/**
 * Add / edit a product. Catalog fields go to Firestore `catalog/{sku-id}`, stock fields
 * go to Cloud SQL, and a new photo is uploaded to the media bucket after the save.
 */
export function ProductForm({ initial, categories }: Props) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState<ProductFormInitial>(
    initial ?? {
      sku: "", name: "", description: "", category: categories[0]?.id ?? "", unitOfMeasure: "case", priceCents: 0,
      imageUrl: null, active: true, quantityOnHand: 0, reorderPoint: 0, binLocation: "",
    },
  );
  const [priceDollars, setPriceDollars] = useState(((initial?.priceCents ?? 0) / 100).toFixed(2));
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const update = <K extends keyof ProductFormInitial>(key: K, value: ProductFormInitial[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const docId = isEdit ? initial!.id! : normalizeSkuToId(form.sku);
  const units: string[] = UNITS_OF_MEASURE.includes(form.unitOfMeasure as (typeof UNITS_OF_MEASURE)[number])
    ? [...UNITS_OF_MEASURE]
    : [...UNITS_OF_MEASURE, form.unitOfMeasure];

  function choosePhoto(file: File | null) {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
    if (file) setRemovePhoto(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload = {
        ...(isEdit ? {} : { sku: form.sku }),
        name: form.name,
        description: form.description,
        category: form.category,
        unitOfMeasure: form.unitOfMeasure,
        priceCents: Math.round(Number(priceDollars) * 100),
        active: form.active,
        quantityOnHand: form.quantityOnHand,
        reorderPoint: form.reorderPoint,
        binLocation: form.binLocation || null,
      };
      const res = await fetch(isEdit ? `/api/admin/products/${initial!.id}` : "/api/admin/products", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await readJson(res);
      if (!res.ok) {
        const detail = data.issues?.map((i) => `${i.path}: ${i.message}`).join("; ");
        throw new Error(detail || data.error || "Save failed.");
      }
      const productId = isEdit ? initial!.id! : (data as { product?: { id: string } }).product?.id;
      const warnings = data.warning ? [data.warning] : [];

      if (productId && (photo || removePhoto)) {
        const imgRes = photo
          ? await fetch(`/api/admin/products/${productId}/image`, { method: "POST", body: toFormData(photo) })
          : await fetch(`/api/admin/products/${productId}/image`, { method: "DELETE" });
        if (!imgRes.ok) warnings.push(`Product saved, but the photo wasn't: ${(await readJson(imgRes)).error ?? "upload failed."}`);
      }

      if (warnings.length) {
        // Stay on the page so the warning is seen; editing continues from the saved product.
        setError(warnings.join(" "));
        setBusy(false);
        if (!isEdit && productId) router.replace(`/admin/products/${productId}`);
        router.refresh();
        return;
      }
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  async function setVisibility(active: boolean) {
    if (!initial?.id) return;
    if (!active && !confirm(`Archive "${form.name}"? It will be hidden from the storefront. You can restore it later.`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/products/${initial.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    if (!res.ok) {
      setError((await readJson(res)).error ?? "Could not update the product.");
      setBusy(false);
      return;
    }
    update("active", active);
    setBusy(false);
    router.refresh();
  }

  const shownImage = photoPreview ?? (removePhoto ? null : form.imageUrl);

  return (
    <form onSubmit={onSubmit} className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="card space-y-6">
        <h2 className="text-title-m">Details</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="name">Product name</label>
            <input id="name" className="input" required value={form.name} onChange={(e) => update("name", e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="sku">SKU</label>
            <input
              id="sku"
              className="input"
              required
              disabled={isEdit}
              value={form.sku}
              onChange={(e) => update("sku", e.target.value)}
              placeholder="4001"
              aria-describedby="sku-hint"
            />
            <p id="sku-hint" className="hint">
              {isEdit
                ? "The SKU is the product's catalog id and can't be changed."
                : docId
                  ? `Saved as ${skuFromId(docId)} (catalog id ${docId}).`
                  : "Letters, numbers and dashes, e.g. 4001."}
            </p>
          </div>
          <div>
            <label className="label" htmlFor="category">Category</label>
            <select id="category" className="input" required value={form.category} onChange={(e) => update("category", e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="unit">Sold by the</label>
            <select id="unit" className="input" value={form.unitOfMeasure} onChange={(e) => update("unitOfMeasure", e.target.value)}>
              {units.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="price">Price per {form.unitOfMeasure} (USD)</label>
            <input id="price" type="number" min={0} step="0.01" className="input" required value={priceDollars} onChange={(e) => setPriceDollars(e.target.value)} />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2.5 py-2.5 text-sm">
              <input type="checkbox" className="size-4 accent-[var(--accent-ink)]" checked={form.active} onChange={(e) => update("active", e.target.checked)} />
              Visible in the catalog
            </label>
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="description">Description</label>
            <textarea id="description" rows={4} className="input" value={form.description} onChange={(e) => update("description", e.target.value)} />
          </div>
        </div>

        <h2 className="rule pt-6 text-title-m">Stock</h2>
        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="qty">On hand</label>
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

        {error && <p className="alert-error" role="alert">{error}</p>}
        <div className="flex flex-wrap gap-3 border-t border-line pt-6">
          <button type="submit" disabled={busy} className="btn-primary">{busy ? "Saving…" : isEdit ? "Save changes" : "Add product"}</button>
          <button type="button" onClick={() => router.push("/admin/products")} className="btn-secondary">Cancel</button>
          {isEdit &&
            (form.active ? (
              <button type="button" onClick={() => setVisibility(false)} disabled={busy} className="btn-danger ml-auto">Archive product</button>
            ) : (
              <button type="button" onClick={() => setVisibility(true)} disabled={busy} className="btn-secondary ml-auto">Restore to catalog</button>
            ))}
        </div>
      </div>

      <aside className="card space-y-4 lg:sticky lg:top-8">
        <h2 className="text-title-m">Photo</h2>
        <ProductImage src={shownImage} alt="" aspect="4/5" sizes="300px" className="rounded-sm" />
        <input type="file" accept="image/jpeg,image/png,image/webp" aria-label="Choose a photo" onChange={(e) => choosePhoto(e.target.files?.[0] ?? null)} className="block w-full text-sm text-fg-2 file:mr-3 file:rounded-full file:border file:border-line-strong file:bg-transparent file:px-4 file:py-2 file:text-sm file:text-fg hover:file:border-accent-ink" />
        <p className="hint">JPEG, PNG or WebP up to 5 MB. Uploaded to the media bucket when you save.</p>
        {(form.imageUrl || photo) && !removePhoto && (
          <button type="button" onClick={() => { choosePhoto(null); setRemovePhoto(true); }} className="link text-xs text-danger-ink">
            Remove photo
          </button>
        )}
      </aside>
    </form>
  );
}

function toFormData(file: File): FormData {
  const fd = new FormData();
  fd.append("file", file);
  return fd;
}
