"""Create/read/delete one synthetic Lead through Frappe's REST API."""

import json
import pathlib
import secrets
import urllib.parse
import urllib.request


values = dict(
    line.strip().split("=", 1)
    for line in pathlib.Path("/tmp/cera-erpnext-credentials").read_text().splitlines()
    if "=" in line
)
headers = {
    "Authorization": f'token {values["ERPNEXT_API_KEY"]}:{values["ERPNEXT_API_SECRET"]}',
}
base = "http://frontend:8080/api/resource/Lead"
reference = "CERA-API-TEST-" + secrets.token_hex(4).upper()
data = {
    "first_name": "CERA API Test",
    "last_name": "Synthetic",
    "email_id": "cera-api-test@cera.invalid",
    "phone": "+923001234567",
    "company_name": "CERA Synthetic Verification",
    "custom_cera_reference": reference,
    "custom_cera_service": "Test service",
    "custom_cera_status": "received",
    "custom_cera_message": "Provisioning verification only.",
    "custom_cera_country": "Pakistan",
    "custom_cera_source": "Website - Service Page",
}
request = urllib.request.Request(
    base,
    data=json.dumps(data).encode(),
    headers={**headers, "Content-Type": "application/json"},
    method="POST",
)
with urllib.request.urlopen(request, timeout=20) as response:
    name = json.load(response)["data"]["name"]
pathlib.Path("/tmp/cera-api-test-name").write_text(name)

query = urllib.parse.urlencode(
    {
        "filters": json.dumps([["custom_cera_reference", "=", reference]]),
        "fields": json.dumps([
            "name",
            "custom_cera_reference",
            "custom_cera_service",
            "custom_cera_status",
            "custom_cera_country",
            "custom_cera_source",
        ]),
    }
)
request = urllib.request.Request(f"{base}?{query}", headers=headers)
with urllib.request.urlopen(request, timeout=20) as response:
    found = json.load(response)["data"]
assert len(found) == 1 and found[0]["name"] == name
assert found[0]["custom_cera_reference"] == reference
assert found[0]["custom_cera_service"] == data["custom_cera_service"]
assert found[0]["custom_cera_status"] == data["custom_cera_status"]
assert found[0]["custom_cera_country"] == data["custom_cera_country"]
assert found[0]["custom_cera_source"] == data["custom_cera_source"]
print("lead-create-and-read-ok")
