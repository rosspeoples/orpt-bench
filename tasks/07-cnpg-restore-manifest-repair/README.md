# Task 07: CNPG restore manifest repair

Repair a CloudNativePG restore manifest so it follows the safe restore pattern, uses the right secret contract, and avoids reusing the live backup destination.

The workspace includes a restore runbook and secret contract.
The verifier expects the request input to be corrected and the manifest to be regenerated from it.
