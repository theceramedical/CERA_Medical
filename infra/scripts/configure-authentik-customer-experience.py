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
BRAND_DOMAIN = "auth.ceramedical.org"
BRAND_LOGO_URL = "https://www.ceramedical.org/images/cera-logo-lockup.png"
BRAND_CSS = """
:root {
  --ak-accent: #005b7a;
  --ak-accent-strong: #003b50;
  --ak-ink: #111111;
  --ak-surface: #ffffff;
  --ak-page: #ffffff;
}
body {
  background: #ffffff !important;
  color: #111111 !important;
  font-family: Arial, Helvetica, sans-serif !important;
}
/* CERA brutalist identity treatment: white canvas, hard 3px rules, square
   controls, and a compact blue/orange identity mark. Authentik still owns the
   credential and MFA steps; these rules only control the presentation. */
ak-flow-executor {
  --ak-global--background-image: none !important;
  --ak-global--background: #ffffff !important;
  --ak-global--foreground: #111111 !important;
}
ak-brand-links { display: none !important; }
ak-flow-executor::part(container),
ak-flow-executor > * {
  border-radius: 0 !important;
  box-shadow: none !important;
}
form, .pf-c-card, .pf-c-login__main, .pf-c-login__main-header,
.pf-c-login__main-footer-band, .pf-c-login__footer {
  border-radius: 0 !important;
  box-shadow: none !important;
}
.pf-c-card, .pf-c-login__main {
  border: 3px solid #111111 !important;
  background: #ffffff !important;
}
input, select, textarea, button, .pf-c-button {
  border-radius: 0 !important;
  box-shadow: none !important;
}
input, select, textarea {
  border: 3px solid #111111 !important;
  background: #ffffff !important;
  color: #111111 !important;
}
button, .pf-c-button {
  border: 3px solid #111111 !important;
  background: #005b7a !important;
  color: #ffffff !important;
  font-weight: 800 !important;
  letter-spacing: .02em;
}
button:hover, .pf-c-button:hover {
  background: #ffb52e !important;
  color: #111111 !important;
}
a { color: #005b7a !important; font-weight: 700 !important; }
h1, h2, h3, p, label { color: #111111 !important; }
/* The authenticated user portal is an Authentik interface rather than a flow
   executor. Keep it on the same light CERA canvas after login as well. */
html, body, ak-interface, ak-interface main, ak-interface header,
ak-interface nav, ak-interface section, ak-interface footer,
ak-interface [class*="pf-c-"], ak-interface [class*="pf-l-"] {
  background: #ffffff !important;
  color: #111111 !important;
  background-image: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}
ak-interface a, ak-interface button, ak-interface h1, ak-interface h2,
ak-interface h3, ak-interface p, ak-interface label, ak-interface span,
ak-interface strong { color: #111111 !important; }
ak-interface header, ak-interface nav {
  border-bottom: 3px solid #111111 !important;
}
ak-interface a:hover, ak-interface button:hover {
  background: #ffb52e !important;
  color: #111111 !important;
}
ak-interface input, ak-interface textarea, ak-interface select,
ak-interface [role="combobox"] {
  border: 3px solid #111111 !important;
  background: #ffffff !important;
  color: #111111 !important;
  border-radius: 0 !important;
}
ak-interface button, ak-interface [role="button"] {
  border: 3px solid #111111 !important;
  background: #005b7a !important;
  color: #ffffff !important;
  border-radius: 0 !important;
  font-weight: 800 !important;
}
ak-interface [role="main"], ak-interface .pf-c-page__main,
ak-interface .pf-c-page__main-section, ak-interface .pf-c-card {
  border: 3px solid #111111 !important;
}
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


GOOGLE_EMAIL_VERIFIED = """
raw = info.get("email_verified")
if isinstance(raw, str):
    verified = raw.strip().lower() == "true"
else:
    verified = raw is True
email = info.get("email") if isinstance(info.get("email"), str) else None
attributes = dict((request.user.attributes if request.user else None) or {})
# Record Google's claim explicitly, including False. A missing claim is not
# verification. Do not leave the attribute unset, or the email scope would
# fall back to treating any address as verified.
attributes["email_verified"] = True if verified else False
attributes["email_verified_source"] = "google"
result = {"attributes": attributes}
if email:
    result["email"] = email
name = info.get("name")
if isinstance(name, str) and name:
    result["name"] = name
return result
"""

CERA_EMAIL_SCOPE = """
attributes = request.user.attributes or {}
if "email_verified" in attributes:
    verified = attributes.get("email_verified")
    if isinstance(verified, str):
        verified = verified.strip().lower() == "true"
    else:
        verified = verified is True
else:
    # Accounts created before Google's claim was stored have no attribute.
    # Keep the previous email-scope behaviour for those accounts only.
    # Google sign-in always writes the attribute, including when it is false.
    verified = bool(request.user.email)
return {
    "email": request.user.email,
    "email_verified": verified is True,
}
"""


def ensure_google_email_verification(source):
    try:
        from authentik.sources.oauth.models import OAuthSourcePropertyMapping
    except ImportError:
        print("OAuthSourcePropertyMapping is unavailable; Google email_verified mapping was not installed.")
        return
    mapping, _created = OAuthSourcePropertyMapping.objects.get_or_create(
        name="CERA Google email_verified",
        defaults={"expression": GOOGLE_EMAIL_VERIFIED},
    )
    mapping.expression = GOOGLE_EMAIL_VERIFIED
    mapping.save()
    relation = None
    for name in ("user_property_mappings", "property_mappings"):
        if hasattr(source, name):
            relation = getattr(source, name)
            break
    if relation is None:
        print("Google source has no property-mapping relation; email_verified mapping was saved but not attached.")
        return
    relation.add(mapping)
    print("CERA Google email_verified property mapping attached.")


def ensure_email_scope(provider):
    from authentik.providers.oauth2.models import ScopeMapping

    mapping, _created = ScopeMapping.objects.get_or_create(
        name="CERA email verification",
        defaults={"scope_name": "email", "expression": CERA_EMAIL_SCOPE},
    )
    mapping.scope_name = "email"
    mapping.expression = CERA_EMAIL_SCOPE
    mapping.save()
    for existing in list(provider.property_mappings.all()):
        if getattr(existing, "scope_name", None) == "email" and existing.pk != mapping.pk:
            provider.property_mappings.remove(existing)
    provider.property_mappings.add(mapping)
    staff = OAuth2Provider.objects.filter(name="CERA staff OIDC").first()
    if staff is not None:
        for existing in list(staff.property_mappings.all()):
            if getattr(existing, "scope_name", None) == "email" and existing.pk != mapping.pk:
                staff.property_mappings.remove(existing)
        staff.property_mappings.add(mapping)
    print("CERA email scope emits email_verified from the stored claim.")


def main():
    provider = OAuth2Provider.objects.filter(name=PROVIDER_NAME).first()
    if provider is None:
        raise SystemExit(f"Authentik provider {PROVIDER_NAME!r} was not found.")

    application = application_for(provider)
    if application is not None and application.name != "CERA Medical":
        application.name = "CERA Medical"
        application.save(update_fields=["name"])

    brand = Brand.objects.filter(domain=BRAND_DOMAIN).first()
    if brand is None:
        brand = Brand.objects.filter(default=True).first()
    if brand is not None:
        # The default brand is initially named ``authentik-default``. Leaving
        # that domain in place means requests for auth.ceramedical.org keep
        # matching the fallback brand, which is why the old Authentik logo and
        # background were still visible in production.
        brand.domain = BRAND_DOMAIN
        brand.default = True
        brand.branding_title = "CERA Medical"
        brand.branding_custom_css = BRAND_CSS
        brand.save()
        # Authentik's branding file fields are serialized as paths/URLs in the
        # flow payload. A public CERA asset keeps the identity service image in
        # sync with the website without bundling a second copy into the auth
        # container.
        brand.branding_logo = BRAND_LOGO_URL
        brand.branding_default_flow_background = ""
        brand.save(update_fields=["branding_logo", "branding_default_flow_background"])

    flow = provider.authentication_flow
    if flow is not None and flow.title != "Sign in to CERA Medical":
        flow.title = "Sign in to CERA Medical"
        flow.save(update_fields=["title"])

    ensure_email_scope(provider)

    source = OAuthSource.objects.filter(slug=GOOGLE_SLUG).first()
    stage = identification_stage(flow) if flow is not None else None
    if source is None or stage is None:
        print("Google source or identification stage is not configured; customer branding still applied.")
        return

    ensure_google_email_verification(source)
    stage.sources.add(source)
    enrollment = ensure_customer_enrollment()
    if source.enrollment_flow_id != enrollment.pk:
        source.enrollment_flow = enrollment
        source.save(update_fields=["enrollment_flow"])
    print("CERA customer sign-in branding and Google enrollment are configured.")


main()
