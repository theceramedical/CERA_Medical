"""Idempotently configure CERA role claims and the initial CERA administrator.

Run through ``ak shell`` after the production Authentik service is healthy.
The profile scope is already requested by the CERA OIDC client, so placing the
groups claim on that scope avoids an extra client scope configuration step.
"""

from authentik.core.models import Application, Group, User
from authentik.providers.oauth2.models import OAuth2Provider, ScopeMapping


ROLE_GROUPS = (
    "cera-customers",
    "cera-content-editors",
    "cera-content-approvers",
    "cera-enquiry-handlers",
    "cera-operations-managers",
    "cera-administrators",
    "cera-auditors",
)
PROVIDER_NAME = "CERA production OIDC"
STAFF_PROVIDER_NAME = "CERA staff OIDC"
ADMIN_USERNAME = "akadmin"
MAPPING_NAME = "CERA production role groups"
GROUPS_EXPRESSION = (
    'return {"groups": [group.name for group in request.user.ak_groups.all() '
    'if group.name.startswith("cera-")]}'
)

import os

REDIRECT_URI = os.environ.get(
    "OIDC_REDIRECT_URI", "https://www.ceramedical.org/auth/callback"
).strip()

provider = OAuth2Provider.objects.get(name=PROVIDER_NAME)
provider._redirect_uris = [{"matching_mode": "strict", "url": REDIRECT_URI}]
provider.save(update_fields=["_redirect_uris"])
mapping, _ = ScopeMapping.objects.get_or_create(
    name=MAPPING_NAME,
    defaults={"scope_name": "profile", "expression": GROUPS_EXPRESSION},
)
mapping.scope_name = "profile"
mapping.expression = GROUPS_EXPRESSION
mapping.save()
provider.property_mappings.add(mapping)

# Keep customer and staff as separate OAuth clients. The application binds the
# audience into its encrypted state, while the staff client gives Authentik a
# distinct redirectable trust boundary and a credential that can be rotated
# independently. Staff credentials are supplied through the host env and are
# never printed by this script.
staff_client_id = os.environ.get("OIDC_STAFF_CLIENT_ID", "").strip()
staff_client_secret = os.environ.get("OIDC_STAFF_CLIENT_SECRET", "").strip()
if staff_client_id and staff_client_secret:
    staff_provider, _ = OAuth2Provider.objects.get_or_create(
        name=STAFF_PROVIDER_NAME,
        defaults={
            "client_id": staff_client_id,
            "client_secret": staff_client_secret,
            "client_type": provider.client_type,
            "authorization_flow": provider.authorization_flow,
            "authentication_flow": provider.authentication_flow,
            "invalidation_flow": provider.invalidation_flow,
            "signing_key": provider.signing_key,
            "include_claims_in_id_token": True,
            "grant_types": ["authorization_code"],
        },
    )
    staff_provider.client_id = staff_client_id
    staff_provider.client_secret = staff_client_secret
    staff_provider._redirect_uris = [{"matching_mode": "strict", "url": REDIRECT_URI}]
    if hasattr(staff_provider, "authorization_flow"):
        staff_provider.authorization_flow = provider.authorization_flow
    if hasattr(staff_provider, "authentication_flow"):
        staff_provider.authentication_flow = provider.authentication_flow
    staff_provider.save()
    staff_provider.property_mappings.add(mapping)
    Application.objects.update_or_create(
        slug="cera-staff",
        defaults={"name": "CERA Medical Staff", "provider": staff_provider},
    )
    print("CERA staff OIDC client configured.")
else:
    print("CERA staff OIDC skipped: OIDC_STAFF_CLIENT_ID/SECRET not set.")

for group_name in ROLE_GROUPS:
    Group.objects.get_or_create(name=group_name)

admin = User.objects.get(username=ADMIN_USERNAME)
admin.ak_groups.add(Group.objects.get(name="cera-administrators"))

print("CERA OIDC role claims configured; initial administrator assigned.")
