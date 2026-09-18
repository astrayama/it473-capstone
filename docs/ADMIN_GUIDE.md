# Staff guide: managing products, stock, customers and orders

You do not need any technical knowledge for this. Everything happens in your web browser.

## Signing in

1. Go to the website and click **Sign in** (top right).
2. Use your staff email and password. If you do not have one yet, ask the site owner to add
   your email to the staff list and create your login.
3. You will see an **Admin** badge in the top bar. Click it.

## The admin pages

* **Dashboard** – quick counts: products, low-stock items, customers waiting for approval,
  orders that need to be shipped.
* **Products** – everything customers can see in the catalog.
* **Inventory** – how many cases of each product are in the warehouse.
* **Orders** – what customers have ordered and where each order is in the process.
* **Customers** – wholesale accounts and whether they are approved.

## Adding a product

1. **Admin → Products → + Add product**.
2. Fill in:
   * **Product name** – what customers see, e.g. *Whole Milk, Gallon*.
   * **SKU** – your internal code. Must be unique.
   * **Brand**, **Category**, **Storage** (refrigerated / frozen / ambient).
   * **Pack size** – how it is packed, e.g. *4 × 1 gal* or *25 lb*.
   * **Units per case** and **Case price** in dollars (customers always buy whole cases).
   * **Visible in the catalog** – untick to hide a product without deleting it (seasonal items).
   * **Description** – a sentence or two.
3. Under **Stock**, enter **Cases on hand**, the **Low-stock alert** level, and the warehouse
   **bin** if you use them.
4. Optional: choose a **Photo** (JPEG/PNG, under 5 MB).
5. Click **Add product**. It appears in the catalog immediately.

## Changing a price, photo, or description

**Admin → Products**, type part of the name or SKU in the search box, click **Edit**, change
the fields, and click **Save changes**.

## Hiding or deleting a product

* To hide temporarily: edit the product and untick **Visible in the catalog**.
* To delete permanently: edit the product and click **Delete product** (bottom right).
  Past orders keep their own copy of the product details, so history is not affected.

## Updating stock counts

**Admin → Inventory** shows every product in one table. Change the **On hand** number (or the
alert level or bin) and click **Save** on that row. Rows highlighted in yellow are at or below
their low-stock alert.

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

**I made a typo in a SKU.** Edit the product and correct it; the SKU only needs to be unique.

**Can I add a new category?** Categories are fixed in the site settings. Ask the developer to
add one (it is a one-line change in `src/config/categories.ts` plus a placeholder image).

**Where do the photos go?** They are stored safely in Google Cloud Storage; you never need to
manage that yourself.
