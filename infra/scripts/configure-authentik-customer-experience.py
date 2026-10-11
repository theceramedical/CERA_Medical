"""Brand customer sign-in and keep Google enrollment off the staff-looking default flow.

Run through ``ak shell`` after ``configure-authentik-cera.py``. Idempotent.
A missing Google source is reported and skipped so a host that has not
connected Google yet can still deploy.
"""

from authentik.brands.models import Brand
from authentik.core.models import Application, Group
from authentik.flows.models import Flow, FlowStageBinding
from authentik.policies.expression.models import ExpressionPolicy
from authentik.policies.models import PolicyBinding
from authentik.providers.oauth2.models import OAuth2Provider
from authentik.sources.oauth.models import OAuthSource
from authentik.stages.identification.models import IdentificationStage

PROVIDER_NAME = "CERA production OIDC"
GOOGLE_SLUG = "google"
ENROLLMENT_SLUG = "cera-customer-enrollment"
CUSTOMER_GROUP = "cera-customers"
STAFF_GROUPS = (
    "cera-administrators",
    "cera-content-editors",
    "cera-content-approvers",
    "cera-enquiry-handlers",
    "cera-operations-managers",
    "cera-auditors",
)
ASSIGN_CUSTOMER = f"""
from authentik.core.models import Group
staff = {set(STAFF_GROUPS)!r}
names = {{group.name for group in request.user.ak_groups.all()}}
if names.isdisjoint(staff):
    group, _created = Group.objects.get_or_create(name={CUSTOMER_GROUP!r})
    request.user.ak_groups.add(group)
return True
"""
BRAND_CSS = """
img[alt="authentik Logo"] { display: none; }
.pf-c-login__main { border-top: 4px solid #1f4d3a; }
.pf-c-button.pf-m-primary { background-color: #1f4d3a; }
"""


def application_for(provider):
    return Application.objects.filter(provider=provider).first()


def identification_stage(flow):
    for binding in FlowStageBinding.objects.filter(target=flow).select_related("stage"):
        stage = binding.stage
        # FlowStageBinding returns the polymorphic base Stage. Accessing the reverse
        # one-to-one relation gives us the concrete IdentificationStage when present;
        # `isinstance(stage, IdentificationStage)` is therefore always false here.
        try:
            return stage.identificationstage
        except IdentificationStage.DoesNotExist:
            continue
    return None


def ensure_customer_enrollment():
    defaults = {
        "name": "CERA customer enrollment",
        "title": "Create your CERA account",
        "designation": "enrollment",
        "authentication": "none",
    }
    flow, _created = Flow.objects.get_or_create(slug=ENROLLMENT_SLUG, defaults=defaults)
    flow.name = defaults["name"]
    flow.title = defaults["title"]
    flow.designation = "enrollment"
    flow.authentication = "none"
    flow.save()

    if not FlowStageBinding.objects.filter(target=flow).exists():
        base = Flow.objects.filter(slug="default-source-enrollment").first()
        if base is None:
            print("CERA customer enrollment flow has no stages; default-source-enrollment is missing.")
        else:
            order = 0
            for binding in FlowStageBinding.objects.filter(target=base).order_by("order"):
                order += 10
                created = FlowStageBinding(target=flow, stage=binding.stage, order=order)
                if hasattr(binding, "evaluate_on_plan"):
                    created.evaluate_on_plan = binding.evaluate_on_plan
                if hasattr(binding, "re_evaluate_policies"):
                    created.re_evaluate_policies = binding.re_evaluate_policies
                created.save()

    login_binding = FlowStageBinding.objects.filter(target=flow).order_by("-order").first()
    if login_binding is None:
        return flow

    policy, _created = ExpressionPolicy.objects.get_or_create(
        name="CERA assign customer group",
        defaults={"expression": ASSIGN_CUSTOMER},
    )
    policy.expression = ASSIGN_CUSTOMER
    policy.save()
    PolicyBinding.objects.get_or_create(
        policy=policy,
        target=login_binding,
        defaults={"order": 0, "enabled": True},
    )
    Group.objects.get_or_create(name=CUSTOMER_GROUP)
    return flow


def main():
    provider = OAuth2Provider.objects.filter(name=PROVIDER_NAME).first()
    if provider is None:
        raise SystemExit(f"Authentik provider {PROVIDER_NAME!r} was not found.")

    application = application_for(provider)
    if application is not None and application.name != "CERA Medical":
        application.name = "CERA Medical"
        application.save(update_fields=["name"])

    brand = Brand.objects.filter(domain="auth.ceramedical.org").first()
    if brand is None:
        brand = Brand.objects.filter(default=True).first()
    if brand is not None:
        brand.branding_title = "CERA Medical"
        brand.branding_custom_css = BRAND_CSS
        brand.save()

    flow = provider.authentication_flow
    if flow is not None and flow.title != "Sign in to CERA Medical":
        flow.title = "Sign in to CERA Medical"
        flow.save(update_fields=["title"])

    source = OAuthSource.objects.filter(slug=GOOGLE_SLUG).first()
    stage = identification_stage(flow) if flow is not None else None
    if source is None or stage is None:
        print("Google source or identification stage is not configured; customer branding still applied.")
        return

    stage.sources.add(source)
    enrollment = ensure_customer_enrollment()
    if source.enrollment_flow_id != enrollment.pk:
        source.enrollment_flow = enrollment
        source.save(update_fields=["enrollment_flow"])
    print("CERA customer sign-in branding and Google enrollment are configured.")


main()
