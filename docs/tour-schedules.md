# Tour schedules

A tour is the reusable product and a `tour_time` is one departure. Adding a
departure to an existing tour does not create or clone a tour.

## Public tour list

`GET /api/tours?limit=20&offset=0` is public and does not require an access
token. It returns paginated tours that have at least one future `open`
departure. Only future open departures are included in each tour. `limit`
defaults to 20; `offset` defaults to 0.

`GET /api/tours/:id` is also public. It returns the selected Tour with its
images and all future `open` departures, ordered by start date. The client uses
the chosen `tourTimes[].id` as the departure identifier for the next booking
step. A Tour without any available departure is returned as not found.

## Book a departure

`POST /api/bookings` requires a valid access token. The body contains
`tour_time_id` and `number_of_slots`; `user_id`, status and total price are
always determined by the server. A booking starts as `pending`. The operation
locks the departure while checking active reservations, preventing concurrent
requests from exceeding `max_capacity`.
On success, it returns `{ "success": true }`.

Booking statuses are `pending`, `approved`, `rejected` and `cancelled`.
`pending` and `approved` bookings reserve capacity; `rejected` and `cancelled`
bookings release it.

`GET /api/bookings?limit=20&offset=0` requires a valid access token and returns
the authenticated user's paginated booking history. Each item includes the
booking, the selected departure's ID/date range, and basic Tour information
(`id`, `name`, category and images). The user ID always comes from the access
token, never from a query parameter.

`PUT /api/bookings/:id/cancel` allows the authenticated user to cancel their
own booking while it is still `pending`. A booking that has already been
approved, rejected or cancelled cannot be cancelled by the user. Successful
cancellation returns `{ "success": true }`.

Admins manage booking requests through
`GET /api/admin/bookings?limit=20&offset=0&status=pending`. The status filter is
optional and accepts any booking status. `PUT /api/admin/bookings/:id/status`
accepts `{ "status": "approved" }` or `{ "status": "rejected" }`. Only a
`pending` booking can make this transition; successful updates return
`{ "success": true }`.

After an approve/reject update is saved, the application sends a notification
email through MailHog SMTP (`127.0.0.1:1025` by default). MailHog's local inbox
is available at `http://localhost:8025`.

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
