# Simple Emergent AI prompt — Mangalya

> **Historical and superseded (archived 2026-08-01).** This prompt predates the current
> lavender local-beta implementation. It is retained only as historical input and must not guide
> implementation. Use the canonical documents in the parent `docs/` directory instead.

## BEGIN PROMPT

Build a polished mobile wedding-planning app called **Mangalya** with the tagline **“Your Wedding, Beautifully Organized.”**

Mangalya helps Indian couples and families organize a wedding in one private place instead of using scattered chats, notes, calls, and spreadsheets. The app should feel warm, elegant, calm, and easy to use. Wedding traditions differ between families, so every ceremony, task, and planning item must be optional and editable. Do not present any tradition as mandatory.

The app should have four main tabs:

### 1. Home

- Show the couple or wedding name, wedding date, location, and days remaining.
- Show the next upcoming wedding event.
- Show the three most important upcoming or overdue tasks.
- Let users mark tasks as complete.
- Show a budget overview with planned, spent, paid, and outstanding amounts in Indian rupees.
- Include one Add button for quickly adding a task, event, or expense.

### 2. Plan

Include two sections: **Events** and **Tasks**.

Events:

- Show all wedding events in a timeline.
- Let users add, edit, view, reorder, and delete events.
- Each event can have a name, date, time, location, notes, related tasks, and required-item progress.
- Events can be anything the family chooses, such as an engagement, Haldi, Mehendi, wedding ceremony, reception, or a completely custom event.

Tasks:

- Let users add, edit, complete, and delete tasks.
- A task can have a title, related event, due date, priority, status, responsible person, category, description, notes, checklist, and attachments.
- Provide filters for status, priority, event, this week, and overdue tasks.
- Clearly distinguish completed, upcoming, and overdue tasks.

### 3. Budget

- Let users add, edit, view, filter, and delete wedding expenses through a fast title, visual category, and actual-amount flow.
- Save the local current date by default, then let users optionally change the date or add a note and one receipt.
- Show the wedding target, actual spending, pending/over amount, newest expenses, and labelled category bars.
- Do not expose planned, paid, payment status, due date, vendor, or linked-event fields in new expense flows.
- Display all money using Indian rupee formatting, such as `₹28,00,000`.

### 4. More

Include these useful planning tools:

- **Wedding Settings:** use one editor for wedding name, type/tradition, date, and location; edit the target in Budget.
- **Guests:** organize guests by household or family, track RSVP, invitation status, accommodation, and transport needs.
- **Gifts:** track gifts given, received, and return gifts, including value, date, thank-you status, and notes.
- **Emergency Contacts:** save important names, roles, and phone numbers with a tap-to-call option.
- **Backup & Export:** allow users to back up their wedding information and export tasks, expenses, and guests.

Also include:

- A simple welcome and wedding-setup experience for new users.
- Clear loading, empty, error, and confirmation states.
- Confirmation before deleting important information.
- Easy-to-use forms with required fields first and optional details hidden until needed.
- Large, accessible touch targets and readable text.
- A warm premium design using botanical green, antique gold, terracotta, warm white backgrounds, elegant headings, clean body text, and simple icons.
- A bottom navigation bar that is easy to use with one hand.
- Sample wedding data so the app looks complete when first opened, while allowing users to replace everything with their own information.

Build the complete interactive mobile app, not just static screens. All buttons, forms, filters, navigation, create/edit flows, completion controls, totals, and delete confirmations should work. Keep the experience simple and focused on helping a family understand what needs attention next.

## END PROMPT
