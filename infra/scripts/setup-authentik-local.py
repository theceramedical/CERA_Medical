#!/usr/bin/env python3
"""Idempotently provision a local Authentik OIDC app and synthetic test accounts.
Runs Authentik's Django ORM inside the container; never prints credentials.
"""
import json
import os
from pathlib import Path
import secrets
import subprocess

root = Path(__file__).resolve().parents[2]
env_path = root / '.env'
lines = env_path.read_text().splitlines()
values = dict(line.split('=', 1) for line in lines if '=' in line and not line.startswith('#'))
for name, nbytes in [('OIDC_CLIENT_ID', 18), ('OIDC_CLIENT_SECRET', 36), ('AUTHENTIK_BOOTSTRAP_PASSWORD', 24), ('CERA_LOCAL_CUSTOMER_PASSWORD', 18), ('CERA_LOCAL_STAFF_PASSWORD', 18)]:
    if values.get(name, '').startswith('replace-') or not values.get(name):
        values[name] = secrets.token_urlsafe(nbytes)
        lines = [line for line in lines if not line.startswith(name+'=')]
        lines.append(name+'='+values[name])
env_path.write_text('\n'.join(lines)+'\n')
os.chmod(env_path, 0o600)
config = {k:values[k] for k in ['OIDC_CLIENT_ID','OIDC_CLIENT_SECRET','AUTHENTIK_BOOTSTRAP_PASSWORD','CERA_LOCAL_CUSTOMER_PASSWORD','CERA_LOCAL_STAFF_PASSWORD','OIDC_REDIRECT_URI']}
script = '''import json
config=json.loads(CONFIG)
from authentik.flows.models import Flow, FlowStageBinding
from authentik.stages.authenticator_validate.models import AuthenticatorValidateStage
from authentik.stages.authenticator_totp.models import AuthenticatorTOTPStage
from authentik.providers.oauth2.models import OAuth2Provider, ScopeMapping
from authentik.crypto.models import CertificateKeyPair
from authentik.core.models import Application, Group, User
from authentik.policies.models import PolicyBinding
base=Flow.objects.get(slug='default-authentication-flow')
flow,_=Flow.objects.get_or_create(slug='cera-local-authentication',defaults={'name':'CERA local MFA authentication','title':'CERA sign-in','designation':'authentication','authentication':'none'})
for binding in FlowStageBinding.objects.filter(target=base).order_by('order'):
    stage=binding.stage
    if isinstance(stage, AuthenticatorValidateStage):
        stage,_=AuthenticatorValidateStage.objects.get_or_create(name='cera-local-mfa-required',defaults={'not_configured_action':'configure','device_classes':['totp']})
    FlowStageBinding.objects.get_or_create(target=flow,order=binding.order,defaults={'stage':stage})
mfa=AuthenticatorValidateStage.objects.get(name='cera-local-mfa-required')
mfa.device_classes=['totp'];mfa.save()
mfa.configuration_stages.set([AuthenticatorTOTPStage.objects.get(name='default-authenticator-totp-setup')])
email_mapping,_=ScopeMapping.objects.get_or_create(name='CERA local verified email',defaults={'scope_name':'email','expression':"return {'email': request.user.email, 'email_verified': bool(request.user.attributes.get('email_verified'))}"})
mfa_mapping,_=ScopeMapping.objects.get_or_create(name='CERA local MFA assurance',defaults={'scope_name':'cera_mfa','expression':"return {'cera_mfa': True}"})
provider,_=OAuth2Provider.objects.get_or_create(name='CERA local OIDC',defaults={'authentication_flow':flow,'authorization_flow':Flow.objects.get(slug='default-provider-authorization-implicit-consent'),'invalidation_flow':Flow.objects.get(slug='default-provider-invalidation-flow'),'client_id':config['OIDC_CLIENT_ID'],'client_secret':config['OIDC_CLIENT_SECRET'],'_redirect_uris':[{'matching_mode':'strict','url':config['OIDC_REDIRECT_URI']}],'signing_key':CertificateKeyPair.objects.get(name='authentik Self-signed Certificate'),'include_claims_in_id_token':True,'grant_types':['authorization_code']})
provider.authentication_flow=flow
provider.client_id=config['OIDC_CLIENT_ID']
provider.client_secret=config['OIDC_CLIENT_SECRET']
provider._redirect_uris=[{'matching_mode':'strict','url':config['OIDC_REDIRECT_URI']}]
provider.signing_key=CertificateKeyPair.objects.get(name='authentik Self-signed Certificate')
provider.grant_types=['authorization_code']
provider.save()
provider.property_mappings.set([ScopeMapping.objects.get(scope_name='openid'),ScopeMapping.objects.get(scope_name='profile'),email_mapping,mfa_mapping])
Application.objects.update_or_create(slug='cera-local',defaults={'name':'CERA local','provider':provider})
for username,email,name,group,password in [
 ('cera-local-customer','cera-customer@cera.localhost','CERA Local Customer','cera-customers',config['CERA_LOCAL_CUSTOMER_PASSWORD']),
 ('cera-local-staff','cera-staff@cera.localhost','CERA Local Staff','cera-enquiry-handlers',config['CERA_LOCAL_STAFF_PASSWORD'])]:
    user,_=User.objects.get_or_create(username=username,defaults={'email':email,'name':name,'attributes':{'email_verified':True}})
    user.email=email;user.name=name;user.attributes={**user.attributes,'email_verified':True};user.set_password(password);user.save()
    role,_=Group.objects.get_or_create(name=group);user.ak_groups.add(role)
admin=User.objects.get(username='akadmin');admin.set_password(config['AUTHENTIK_BOOTSTRAP_PASSWORD']);admin.save()
print('CERA local provider and two accounts configured')
'''
run = "CONFIG=" + repr(json.dumps(config)) + "\n" + script
result = subprocess.run(['docker','exec','-i','cera-authentik-server-1','ak','shell','-c','exec(__import__(\"sys\").stdin.read())'], input=run, text=True, capture_output=True)
print(result.stdout[-1000:])
if result.returncode:
    print(result.stderr[-1400:])
    raise SystemExit(result.returncode)
