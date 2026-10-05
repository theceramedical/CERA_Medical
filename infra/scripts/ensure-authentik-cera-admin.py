"""Ensure CERA operator accounts in Authentik (run via: ak shell < this file)."""

import os

from authentik.core.models import Group, User

OPERATOR_EMAIL = os.environ.get("CERA_OPERATOR_EMAIL", "admin@ceramedical.org").strip()
OPERATOR_PASSWORD = os.environ.get("CERA_OPERATOR_PASSWORD", "").strip()
AKADMIN_PASSWORD = os.environ.get("CERA_AKADMIN_PASSWORD", OPERATOR_PASSWORD).strip()

STAFF_GROUPS = (
    "cera-administrators",
    "cera-enquiry-handlers",
    "authentik Admins",
)
CUSTOMER_GROUP = "cera-customers"

for name in (
    *STAFF_GROUPS,
    CUSTOMER_GROUP,
    "cera-content-editors",
    "cera-content-approvers",
    "cera-operations-managers",
    "cera-auditors",
):
    Group.objects.get_or_create(name=name)


def set_password(user: User, password: str) -> None:
    if not password:
        return
    user.set_password(password)
    user.save()


akadmin = User.objects.get(username="akadmin")
if AKADMIN_PASSWORD:
    set_password(akadmin, AKADMIN_PASSWORD)
for gn in ("cera-administrators", "authentik Admins"):
    akadmin.ak_groups.add(Group.objects.get(name=gn))
customer = Group.objects.get(name=CUSTOMER_GROUP)
akadmin.ak_groups.remove(customer)

operator, created = User.objects.get_or_create(
    username=OPERATOR_EMAIL,
    defaults={"email": OPERATOR_EMAIL, "name": "CERA Admin"},
)
operator.email = OPERATOR_EMAIL
operator.name = "CERA Admin"
operator.is_active = True
if OPERATOR_PASSWORD:
    set_password(operator, OPERATOR_PASSWORD)
operator.save()
for gn in STAFF_GROUPS:
    operator.ak_groups.add(Group.objects.get(name=gn))
operator.ak_groups.remove(customer)

print(
    f"CERA_OPERATOR email={OPERATOR_EMAIL} created={created} "
    f"groups={sorted(g.name for g in operator.ak_groups.all())}"
)
