"""Run inside a Frappe bench console for the private CERA ERPNext site.

This is idempotent. On first creation only, it prints an API credential marker
for the host provisioning wrapper to capture into a mode-600 file. Never log it.
"""

import json
import secrets

import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields
from frappe.permissions import add_permission, update_permission_property


ROLE = "CERA Integration"
USER = "cera-integration@cera.invalid"
FIELDS = [
    {"fieldname": "custom_cera_reference", "label": "CERA Reference", "fieldtype": "Data", "unique": 1, "reqd": 1, "insert_after": "lead_name"},
    {"fieldname": "custom_cera_service", "label": "CERA Service", "fieldtype": "Data", "insert_after": "custom_cera_reference"},
    {"fieldname": "custom_cera_status", "label": "CERA Status", "fieldtype": "Data", "insert_after": "custom_cera_service"},
    {"fieldname": "custom_cera_message", "label": "CERA Message", "fieldtype": "Small Text", "insert_after": "custom_cera_status"},
]


def provision():
    frappe.set_user("Administrator")
    create_custom_fields({"Lead": FIELDS})

    if not frappe.db.exists("Role", ROLE):
        frappe.get_doc({"doctype": "Role", "role_name": ROLE, "desk_access": 0}).insert(ignore_permissions=True)

    if not frappe.db.exists("Custom DocPerm", {"parent": "Lead", "role": ROLE, "permlevel": 0, "if_owner": 0}):
        add_permission("Lead", ROLE)
    for permission in ("read", "create", "write"):
        update_permission_property("Lead", ROLE, 0, permission, 1)

    credentials = None
    if not frappe.db.exists("User", USER):
        key = secrets.token_hex(12)
        secret = secrets.token_urlsafe(36)
        frappe.get_doc({
            "doctype": "User",
            "email": USER,
            "first_name": "CERA",
            "last_name": "Integration",
            "enabled": 1,
            "user_type": "System User",
            "send_welcome_email": 0,
            "api_key": key,
            "api_secret": secret,
            "roles": [{"role": ROLE}],
        }).insert(ignore_permissions=True)
        credentials = {"ERPNEXT_API_KEY": key, "ERPNEXT_API_SECRET": secret}

    for field in FIELDS:
        actual = frappe.get_meta("Lead").get_field(field["fieldname"])
        assert actual is not None and actual.fieldtype == field["fieldtype"]
    user = frappe.get_doc("User", USER)
    assert {row.role for row in user.roles} == {ROLE}
    frappe.db.commit()
    if credentials is not None:
        print("CERA_INTEGRATION_CREDENTIALS=" + json.dumps(credentials, separators=(",", ":")))
    print("CERA_INTEGRATION_PROVISIONED")


provision()
