# Tour schedules

A tour is the reusable product and a `tour_time` is one departure. Adding a
departure to an existing tour does not create or clone a tour.

## Create a tour

`POST /api/admin/tours` accepts `multipart/form-data`. Text fields are sent
normally, `tour_times` is a JSON string, and up to 5 image files are sent with
the repeated field name `images`:

```json
{
  "category_id": 1,
  "title": "Da Nang discovery",
  "description": "Three-day tour",
  "tour_times": [
    {
      "start_date": "2027-01-10",
      "end_date": "2027-01-12",
      "price": 2500000,
      "max_capacity": 20
    }
  ]
}
```

The tour and all its initial times are persisted in one transaction.
Uploaded JPG, PNG and WEBP files are limited to 5 MB each. Files are stored
under `uploads/tours`, while their public `/uploads/tours/...` paths and sort
order are stored in `tour_images`.

## Edit the complete tour in one form

`PUT /api/admin/tours/:id` updates the tour in one form. Submitted existing
times have an `id`, new times do not, and removal is always explicit through
`deleted_tour_time_ids`:

```json
{
  "category_id": 1,
  "title": "Da Nang discovery",
  "description": "Updated description",
  "tour_times": [
    {
      "id": 10,
      "start_date": "2027-01-10",
      "end_date": "2027-01-12",
      "price": 2500000,
      "max_capacity": 20,
      "status": "closed"
    },
    {
      "start_date": "2027-02-10",
      "end_date": "2027-02-12",
      "price": 2700000,
      "max_capacity": 25,
      "status": "open"
    }
  ],
  "deleted_tour_time_ids": [11]
}
```

Existing times omitted from both arrays remain unchanged. The server never
infers deletion from a missing item. The save is transactional, so all changes
succeed or fail together.
On success, the endpoint returns `{ "success": true }`.
When using FormData, send `tour_times` and `deleted_tour_time_ids` as JSON
strings. New `images` files are appended to the Tour's existing images.

Tour detail returns `hasBookings` for every time. The frontend should disable
cancellation when `hasBookings` is true. The server always counts bookings
again while saving and rejects cancellation if any exist; no confirmation
field is accepted from the client.

Adding, editing, closing, reopening, cancelling and deleting times are all
submitted through this single endpoint. There are no separate time mutation
routes, so every change receives the same validation and transaction boundary.

`closed` stops new bookings without changing existing bookings. `cancelled`
means the departure will not run and is only allowed when the time has no
bookings. A cancelled time is terminal and cannot be reopened.

Times of the same tour cannot overlap unless the existing time is cancelled.
A tour or time with booking history cannot be deleted, preserving audit and
payment history. Deleting an unbooked time is a soft delete (`deleted_at`),
while `cancelled` remains a visible business-history status. Soft-deleted times
are excluded from normal tour queries.
