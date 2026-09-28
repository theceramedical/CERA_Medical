"""Create/read/delete one synthetic Lead through Frappe's REST API."""

import json
import pathlib
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
data = {
    "first_name": "CERA API Test",
    "email_id": "cera-api-test@example.invalid",
    "custom_cera_reference": "CERA-API-TEST-20260928",
    "custom_cera_service": "Test service",
    "custom_cera_status": "new",
    "custom_cera_message": "Provisioning verification only.",
}
request = urllib.request.Request(
    base,
    data=json.dumps(data).encode(),
    headers={**headers, "Content-Type": "application/json"},
    method="POST",
)
with urllib.request.urlopen(request, timeout=20) as response:
    name = json.load(response)["data"]["name"]

query = urllib.parse.urlencode(
    {
        "filters": json.dumps([["custom_cera_reference", "=", data["custom_cera_reference"]]]),
        "fields": json.dumps(["name", "custom_cera_reference", "custom_cera_service"]),
    }
)
request = urllib.request.Request(f"{base}?{query}", headers=headers)
with urllib.request.urlopen(request, timeout=20) as response:
    found = json.load(response)["data"]
assert len(found) == 1 and found[0]["name"] == name
pathlib.Path("/tmp/cera-api-test-name").write_text(name)
print("lead-create-and-read-ok")
