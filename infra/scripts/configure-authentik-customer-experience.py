"""Brand customer sign-in and keep Google enrollment off the staff-looking default flow.

Run through ``ak shell`` after ``configure-authentik-cera.py``. Idempotent.
A missing Google source is reported and skipped so a host that has not
connected Google yet can still deploy.
"""

from authentik.brands.models import Brand
from authentik.core.models import Application, Group, User
from authentik.flows.models import Flow, FlowStageBinding
from authentik.policies.expression.models import ExpressionPolicy
from authentik.policies.models import PolicyBinding
from authentik.providers.oauth2.models import OAuth2Provider
from authentik.sources.oauth.models import OAuthSource, UserOAuthSourceConnection
from authentik.stages.identification.models import IdentificationStage
from authentik.stages.redirect.models import RedirectMode, RedirectStage
from authentik.stages.user_login.models import UserLoginStage
from authentik.stages.user_logout.models import UserLogoutStage

PROVIDER_NAME = "CERA production OIDC"
STAFF_PROVIDER_NAME = "CERA staff OIDC"
GOOGLE_SLUG = "google"
ENROLLMENT_SLUG = "cera-customer-enrollment"
SOURCE_AUTHENTICATION_SLUG = "cera-customer-source-authentication"
SITE_URL = "https://www.ceramedical.org"
# Authentik formats launch URLs with `%`, so the return path stays unencoded.
CUSTOMER_LAUNCH_URL = f"{SITE_URL}/auth/signin?next=/account"
GMAIL_DOMAINS = ("gmail.com", "googlemail.com")
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


# Authentik's Google source reads the v1 userinfo endpoint, which reports
# `verified_email`; OpenID userinfo reports `email_verified`. Accept either.
GOOGLE_EMAIL_VERIFIED = """
def claim(value):
    if isinstance(value, str):
        return value.strip().lower() == "true"
    return value is True

verified = claim(info.get("email_verified")) or claim(info.get("verified_email"))
email = info.get("email") if isinstance(info.get("email"), str) else None
attributes = dict((request.user.attributes if request.user else None) or {})
# Record Google's claim explicitly, including False. A missing claim is not
# verification. Do not leave the attribute unset, or the email scope would
# fall back to treating any address as verified.
attributes["email_verified"] = bool(verified and email)
attributes["email_verified_source"] = "google"
attributes["email_verified_address"] = email.strip().lower() if verified and email else ""
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
current = (request.user.email or "").strip().lower()
if "email_verified" in attributes:
    verified = attributes.get("email_verified")
    if isinstance(verified, str):
        verified = verified.strip().lower() == "true"
    else:
        verified = verified is True
    # Verification belongs to an address. If the account email changed after
    # the provider verified it, the new address is not verified.
    address = attributes.get("email_verified_address")
    if verified and isinstance(address, str) and address and address != current:
        verified = False
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


# Runs as a flow-level policy on every source sign-in, so a returning Google
# customer's verification follows Google's current claim rather than whatever
# was stored at enrollment. It always passes; a failure is logged, not fatal.
SYNC_EMAIL_VERIFICATION = """
try:
    user = context.get("pending_user")
    info = context.get("oauth_userinfo")
    source = context.get("source")
    if user is not None and getattr(user, "pk", None) and isinstance(info, dict):
        raw_values = (info.get("email_verified"), info.get("verified_email"))
        verified = any(
            (value.strip().lower() == "true") if isinstance(value, str) else value is True
            for value in raw_values
        )
        provider_email = info.get("email") if isinstance(info.get("email"), str) else ""
        current = (user.email or "").strip().lower()
        matches = bool(current) and provider_email.strip().lower() == current
        source_slug = getattr(source, "slug", "oauth")
        attributes = dict(user.attributes or {})
        if verified and matches:
            attributes["email_verified"] = True
            attributes["email_verified_source"] = source_slug
            attributes["email_verified_address"] = current
        elif attributes.get("email_verified_source") in (None, source_slug):
            attributes["email_verified"] = False
            attributes["email_verified_source"] = source_slug
            attributes["email_verified_address"] = ""
        if attributes != (user.attributes or {}):
            user.attributes = attributes
            user.save(update_fields=["attributes"])
except Exception as exc:
    ak_logger.warning("CERA email verification sync failed", exc=exc)
return True
"""

REQUIRE_SSO = "return ak_is_sso_flow"


def bind_policy(target, name, expression, order):
    policy, _created = ExpressionPolicy.objects.get_or_create(
        name=name, defaults={"expression": expression}
    )
    policy.expression = expression
    policy.save()
    binding, _created = PolicyBinding.objects.get_or_create(
        policy=policy, target=target, defaults={"order": order, "enabled": True}
    )
    if binding.order != order or not binding.enabled:
        binding.order = order
        binding.enabled = True
        binding.save()


def ensure_source_authentication(sources):
    """Sign returning social customers in even when an Authentik session exists.

    The default source flow is ``require_unauthenticated``: Authentik denies it
    when the browser still holds a session for a different account, which is
    the "Flow does not apply to current user" page. The source callback has
    already proven the external identity, so the login stage switches the
    session to the connected account instead.
    """
    flow, _created = Flow.objects.get_or_create(
        slug=SOURCE_AUTHENTICATION_SLUG,
        defaults={
            "name": "CERA customer source sign-in",
            "title": "Sign in to CERA Medical",
            "designation": "authentication",
            "authentication": "none",
        },
    )
    flow.name = "CERA customer source sign-in"
    flow.title = "Sign in to CERA Medical"
    flow.designation = "authentication"
    flow.authentication = "none"
    # Both bound policies must pass; "any" would let the always-true sync policy
    # bypass the SSO requirement.
    flow.policy_engine_mode = "all"
    flow.save()

    login_stage = UserLoginStage.objects.filter(name="default-source-authentication-login").first()
    if login_stage is None:
        login_stage, _created = UserLoginStage.objects.get_or_create(name="cera-customer-source-login")
    FlowStageBinding.objects.update_or_create(
        target=flow, stage=login_stage, defaults={"order": 10}
    )
    bind_policy(flow, "CERA source sign-in requires SSO", REQUIRE_SSO, 0)
    bind_policy(flow, "CERA sync email verification", SYNC_EMAIL_VERIFICATION, 10)

    for source in sources:
        if source.authentication_flow_id != flow.pk:
            source.authentication_flow = flow
            source.save(update_fields=["authentication_flow"])
    print("CERA social sign-in replaces stale Authentik sessions and syncs email verification.")


def social_shortcut_policy(slug):
    # The authorize URL CERA builds carries `source=<slug>`; Authentik keeps
    # that URL as the flow's `next`, which is where the source flow returns.
    return (
        "from urllib.parse import parse_qs, urlsplit\n"
        "if http_request is None:\n"
        "    return False\n"
        'get = http_request.session.get("authentik/flows/get")\n'
        'nxt = get.get("next", "") if get is not None else ""\n'
        f'return {slug!r} in parse_qs(urlsplit(nxt).query).get("source", [])\n'
    )


def ensure_social_shortcut(flow, sources):
    """Send "Continue with Google" on CERA straight to Google.

    Authentik ignores the `source` authorize parameter, so the button stopped
    on the identification page and needed a second click on a bare icon. A
    redirect stage ahead of identification, gated on that parameter, starts
    the source login while the original authorize request stays as `next`.
    """
    own_names = {f"cera-{source.slug}-shortcut" for source in sources}
    orders = [
        binding.order
        for binding in FlowStageBinding.objects.filter(target=flow).select_related("stage")
        if binding.stage.name not in own_names
    ]
    first = min(orders) if orders else 10
    for index, source in enumerate(sources):
        stage, _created = RedirectStage.objects.get_or_create(
            name=f"cera-{source.slug}-shortcut", defaults={"mode": RedirectMode.STATIC}
        )
        stage.mode = RedirectMode.STATIC
        stage.target_static = f"/source/oauth/login/{source.slug}/"
        stage.keep_context = True
        stage.save()
        binding, _created = FlowStageBinding.objects.update_or_create(
            target=flow,
            stage=stage,
            defaults={
                "order": first - len(sources) + index,
                "evaluate_on_plan": False,
                "re_evaluate_policies": True,
            },
        )
        bind_policy(
            binding,
            f"CERA start {source.slug} sign-in directly",
            social_shortcut_policy(source.slug),
            0,
        )
    print("CERA social buttons go straight to the identity provider.")


def ensure_signed_out_flow(audience, logout_stage):
    """A one-stage flow that finishes with a final redirect to the website.

    A Redirect stage or the provider's SessionEndStage only *navigates* away;
    the plan stays in the Authentik session, and the next end-session request
    then returns an empty page. Completing a flow whose plan carries
    ``redirect`` clears the plan before redirecting.
    """
    target = f"{SITE_URL}/auth/signed-out?audience={audience}"
    flow, _created = Flow.objects.get_or_create(
        slug=f"cera-{audience}-signed-out",
        defaults={
            "name": f"CERA {audience} signed out",
            "title": "Signed out of CERA Medical",
            "designation": "invalidation",
            "authentication": "none",
        },
    )
    flow.name = f"CERA {audience} signed out"
    flow.title = "Signed out of CERA Medical"
    flow.designation = "invalidation"
    flow.authentication = "none"
    flow.save()
    binding, _created = FlowStageBinding.objects.update_or_create(
        target=flow,
        stage=logout_stage,
        defaults={"order": 10, "evaluate_on_plan": True, "re_evaluate_policies": False},
    )
    expression = (
        'plan = context.get("flow_plan")\n'
        "if plan is not None:\n"
        f'    plan.context["redirect"] = {target!r}\n'
        "return True\n"
    )
    bind_policy(binding, f"CERA {audience} return to website after sign-out", expression, 0)
    return flow


def ensure_invalidation_flow(provider, audience):
    """End the Authentik session on CERA sign-out, then return to the site.

    Authentik's default provider invalidation flow has no stages, so signing
    out of CERA left the Authentik session alive. The next sign-in then reused
    whichever account that browser last used.
    """
    flow, _created = Flow.objects.get_or_create(
        slug=f"cera-{audience}-invalidation",
        defaults={
            "name": f"CERA {audience} sign-out",
            "title": "Signing out of CERA Medical",
            "designation": "invalidation",
            "authentication": "none",
        },
    )
    flow.name = f"CERA {audience} sign-out"
    flow.title = "Signing out of CERA Medical"
    flow.designation = "invalidation"
    flow.authentication = "none"
    flow.save()

    logout_stage, _created = UserLogoutStage.objects.get_or_create(name="cera-user-logout")
    signed_out = ensure_signed_out_flow(audience, logout_stage)
    # Hand off to the signed-out flow so this plan never reaches the appended
    # SessionEndStage, which would leave the plan behind in the session.
    redirect_stage, _created = RedirectStage.objects.get_or_create(
        name=f"cera-{audience}-signed-out",
        defaults={"mode": RedirectMode.FLOW},
    )
    redirect_stage.mode = RedirectMode.FLOW
    redirect_stage.target_flow = signed_out
    redirect_stage.target_static = ""
    redirect_stage.keep_context = False
    redirect_stage.save()
    FlowStageBinding.objects.update_or_create(
        target=flow, stage=logout_stage, defaults={"order": 10}
    )
    FlowStageBinding.objects.update_or_create(
        target=flow, stage=redirect_stage, defaults={"order": 20}
    )
    if provider.invalidation_flow_id != flow.pk:
        provider.invalidation_flow = flow
        provider.save(update_fields=["invalidation_flow"])


def ensure_customer_landing(brand, application):
    """Send customer (external) accounts to the website, not Authentik's portal.

    Without a default application, an external user who finishes an Authentik
    flow outside an OAuth request lands on ``/if/user/`` and sees "Interface can
    only be accessed by internal users".
    """
    if application.meta_launch_url != CUSTOMER_LAUNCH_URL:
        application.meta_launch_url = CUSTOMER_LAUNCH_URL
        application.save(update_fields=["meta_launch_url"])
    if brand is not None and brand.default_application_id != application.pk:
        brand.default_application = application
        brand.save(update_fields=["default_application"])


def repair_gmail_verification(source):
    """Correct Gmail accounts stored as unverified by the earlier mapping.

    Before `verified_email` was read, every Google enrollment stored
    ``email_verified: False``. A Gmail address is owned by the Google account
    that signed in with it, so those records are corrected here; other domains
    are corrected by the sync policy on the customer's next Google sign-in.
    """
    repaired = 0
    connections = UserOAuthSourceConnection.objects.filter(source=source).select_related("user")
    for connection in connections:
        user = connection.user
        email = (user.email or "").strip().lower()
        attributes = dict(user.attributes or {})
        if attributes.get("email_verified_source") != source.slug:
            continue
        if attributes.get("email_verified") is True:
            continue
        if not email or email.rsplit("@", 1)[-1] not in GMAIL_DOMAINS:
            continue
        attributes["email_verified"] = True
        attributes["email_verified_address"] = email
        user.attributes = attributes
        user.save(update_fields=["attributes"])
        repaired += 1
    print(f"CERA Google verification repair: {repaired} account(s) corrected.")


def report_identity_health(source):
    """Print counts only, so the deploy log never carries customer addresses."""
    linked = UserOAuthSourceConnection.objects.filter(source=source).count()
    emails = {}
    for email in User.objects.exclude(email="").values_list("email", flat=True):
        key = email.strip().lower()
        emails[key] = emails.get(key, 0) + 1
    duplicates = sum(1 for count in emails.values() if count > 1)
    print(f"CERA identity health: {linked} Google-linked account(s); {duplicates} email(s) shared by more than one account.")


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

    ensure_invalidation_flow(provider, "customer")
    staff_provider = OAuth2Provider.objects.filter(name=STAFF_PROVIDER_NAME).first()
    if staff_provider is not None:
        ensure_invalidation_flow(staff_provider, "staff")
    print("CERA sign-out ends the Authentik session and returns to the website.")

    if application is not None:
        ensure_customer_landing(brand, application)
        print("CERA customer accounts land on the website instead of the Authentik portal.")

    social_sources = list(
        OAuthSource.objects.filter(slug__in=(GOOGLE_SLUG, "microsoft"), enabled=True)
    )
    if social_sources:
        ensure_source_authentication(social_sources)
        if flow is not None:
            ensure_social_shortcut(flow, social_sources)

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
    repair_gmail_verification(source)
    report_identity_health(source)
    print("CERA customer sign-in branding and Google enrollment are configured.")


main()
