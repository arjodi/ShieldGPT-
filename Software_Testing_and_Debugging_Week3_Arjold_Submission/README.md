# Week 3 Submission: Software Testing and Debugging Exercise
**Student / Engineer:** Arjold
**Task:** Software Testing & Debugging Exercise (Simulated Debugging & Flawed Software Analysis)
**Target Module:** ShieldGPT Prompt & Token Security Guard (SHIELD-SEC-V3)
**Status:** Complete (100% Bugs Detected, 100% Fixed in Refactored Code, >90% Test Coverage)

## Deliverables Manifest
1. `/source_code/flawed/shield_security_guard.ts` - Original flawed software segment containing 8 deliberate defects.
2. `/source_code/refactored/shield_security_guard.ts` - Hardened, refactored software segment with defensive typing & ReDoS mitigations.
3. `/tests/shield_security_guard.test.ts` - Comprehensive automated unit test suite detecting all 8 defects.
4. `/report/WEEK_3_DEBUGGING_REPORT.md` - Full engineering debugging report (IEEE 829 format).
5. `/report/WEEK_3_DEBUGGING_REPORT.html` - Standalone styled HTML printable report.
6. `/report/BUG_INVENTORY_MATRIX.json` - Structured bug inventory, reproduction steps & fixes.
7. `/report/EXECUTIVE_SUMMARY.txt` - Scannable summary for grading evaluation.

## How to Run Tests
```bash
# Install dependencies
npm install

# Run automated unit test suite against both flawed and refactored targets
npm test
```
