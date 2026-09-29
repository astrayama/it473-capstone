# Staff guide: managing products, stock, customers and orders

You do not need any technical knowledge for this. Everything happens in your web browser.

## Signing in

1. Go to the website and click **Sign in** (top right).
2. Use your staff email and password. If you do not have one yet, ask the site owner to add
   your email to the staff list and create your login.
3. Click **Staff admin** in the top bar. The staff pages have a light theme and their own
   menu on the left (on a phone, tap the menu button at the top).

## The admin pages

* **Dashboard** – quick counts: products, low-stock items, customers waiting for approval,
  orders that need to be shipped.
* **Products** – everything customers can see in the catalog.
* **Inventory** – how many of each product are in the warehouse.
* **Orders** – what customers have ordered and where each order is in the process.
* **Customers** – wholesale accounts and whether they are approved.

## Adding a product

1. **Admin → Products → Add product**.
2. Fill in:
   * **Product name** – what customers see, e.g. *Whole Milk*.
   * **SKU** – a number or code such as `4001`. It becomes the product's catalog id
     (`sku-4001`, shown as **SKU-4001**) and can't be changed later. It must be unique.
   * **Category** – one of the catalog's categories.
   * **Sold by the** – the unit customers buy: case, pack, bag, box or each.
   * **Price per unit** in dollars.
   * **Visible in the catalog** – untick to hide a product without archiving it.
   * **Description** – a sentence or two, e.g. *Case of organic Roma tomatoes, 25 lb*.
3. Under **Stock**, enter the number **On hand**, the **Low-stock alert** level, and the
   warehouse **bin** if you use them.
4. Optional: choose a **Photo** (JPEG, PNG or WebP, under 5 MB).
5. Click **Add product**. It appears in the catalog immediately.

## Changing a price, photo, or description

**Admin → Products**, type part of the name or SKU in the search box, click **Edit**, change
the fields, and click **Save changes**.

## Archiving a product

The catalog is shared with the rest of the team, so products are never deleted from the site.
Edit the product and click **Archive product**: it disappears from the storefront but stays in
the catalog, marked *Archived*. Click **Restore to catalog** to bring it back. Past orders keep
their own copy of the product details either way.

## Updating stock counts

**Admin → Inventory** shows every product in one table. Change the **On hand** number (or the
alert level or bin) and click **Save** on that row. Rows tinted amber are at or below their
low-stock alert. Products marked **Not tracked** (for example, ones added straight to the
catalog) have no count yet: enter one and click **Start tracking**.

Stock also goes down automatically when an order is paid.

## Approving new customers

New businesses that apply appear under **Admin → Customers** with the status
**Pending approval** (the dashboard shows how many are waiting). Check the details and click
**Approve**. Until then they can browse but cannot see prices or order. **Suspend** blocks an
account; **Reset to pending** undoes a suspension.

Use the search box to find any of the thousands of accounts by business name, contact,
email, or city.

## Processing orders

**Admin → Orders** lists orders newest first; filter by status with the drop-down. Click an
order number to see the customer, delivery address, requested delivery date, notes, and the
items. Change the status on the right as it moves along:

| Status | Meaning |
| --- | --- |
| Pending payment | Placed but not yet paid (or payment still processing). |
| Paid | Payment received. Stock is deducted at this point. |
| Confirmed | Warehouse has picked the order. |
| Out for delivery | On the truck. |
| Delivered | Done. |
| Cancelled | Cancelled; stock is not deducted. |

Customers see the current status on their own **Account → Order history** page.

## Common questions

**A customer says they cannot see prices.** Their account is probably still *Pending
approval* — approve it under Customers, or they may not be signed in.

**I made a typo in a SKU.** The SKU is the product's catalog id, so it can't be edited. Archive
the product and add it again with the right SKU.

**Can I add a new category?** Categories live in the team's Firestore `categories` collection
(name, description, sort order). Anything added there appears on the site right away. New
categories get a default cover photo until a developer assigns one in `src/config/photos.ts`.

**Where do the photos go?** They are stored privately in Google Cloud Storage
(`products/<sku>/images/primary.jpg`); the website serves them for you.
