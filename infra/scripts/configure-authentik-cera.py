"""Idempotently configure CERA role claims and the initial CERA administrator.

Run through ``ak shell`` after the production Authentik service is healthy.
The profile scope is already requested by the CERA OIDC client, so placing the
groups claim on that scope avoids an extra client scope configuration step.
"""

from authentik.core.models import Group, User
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
ADMIN_USERNAME = "akadmin"
MAPPING_NAME = "CERA production role groups"
GROUPS_EXPRESSION = (
    'return {"groups": [group.name for group in request.user.ak_groups.all() '
    'if group.name.startswith("cera-")]}'
)

provider = OAuth2Provider.objects.get(name=PROVIDER_NAME)
mapping, _ = ScopeMapping.objects.get_or_create(
    name=MAPPING_NAME,
    defaults={"scope_name": "profile", "expression": GROUPS_EXPRESSION},
)
mapping.scope_name = "profile"
mapping.expression = GROUPS_EXPRESSION
mapping.save()
provider.property_mappings.add(mapping)

for group_name in ROLE_GROUPS:
    Group.objects.get_or_create(name=group_name)

admin = User.objects.get(username=ADMIN_USERNAME)
admin.ak_groups.add(Group.objects.get(name="cera-administrators"))

print("CERA OIDC role claims configured; initial administrator assigned.")
