"""Configure CERA's Authentik login flow for password-only access.

Run through ``ak shell`` after ``configure-authentik-cera.py``.  It is
idempotent and removes only authenticator-validation stages from CERA's OIDC
login flow; it does not delete users' existing authenticator devices.
"""

from authentik.flows.models import Flow, FlowStageBinding
from authentik.stages.authenticator_validate.models import AuthenticatorValidateStage


FLOW_SLUG = "cera-production-authentication"


def is_authenticator_validation(binding: FlowStageBinding) -> bool:
    # ``binding.stage`` is the polymorphic base Stage on current Authentik.
    # Test the concrete model through its primary key rather than relying on a
    # reverse relation which is not available on the base object.
    return AuthenticatorValidateStage.objects.filter(pk=binding.stage_id).exists()


flow = Flow.objects.get(slug=FLOW_SLUG)
removed = 0
for binding in FlowStageBinding.objects.filter(target=flow):
    if is_authenticator_validation(binding):
        binding.delete()
        removed += 1

print(f"CERA password-only authentication configured; removed {removed} MFA stage binding(s).")
