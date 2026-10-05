# Enquiry email delivery

When someone submits **Make an Enquiry**, the API records the request and enqueues integration jobs. The **worker** sends:

| Event                     | Recipient              | Purpose                             |
| ------------------------- | ---------------------- | ----------------------------------- |
| `resend.customer.receipt` | Submitter’s email      | Branded confirmation with reference |
| `resend.staff.alert`      | `EMAIL_STAFF_ALERT_TO` | Full enquiry details for your team  |

## Production checklist

1. Set `EMAIL_DRIVER=resend` (or `smtp`) and configure `RESEND_API_KEY` / `SMTP_URL`.
2. Set `EMAIL_FROM` to a verified sender on your domain (e.g. `CERA Medical <noreply@ceramedical.org>`).
3. Set **`EMAIL_STAFF_ALERT_TO=theceramedical@gmail.com`** (or your shared inbox) in `/opt/cera/.env`.
4. Ensure the **worker** container receives those variables (same env file as API).
5. Confirm the worker is running and outbox jobs succeed (`GET /v1/ops/deliveries` as staff).

If staff alerts never arrive, check worker logs, Resend dashboard, and that `EMAIL_STAFF_ALERT_TO` is set inside the running worker (`docker compose exec worker printenv EMAIL_STAFF_ALERT_TO`).
