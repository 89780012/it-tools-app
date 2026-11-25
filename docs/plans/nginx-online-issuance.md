# Nginx online issuance implementation plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let domain owners download an Nginx PEM bundle issued by Let's Encrypt after DNS validation.

**Architecture:** The opt-in Go API holds short-lived orders and server-generated private keys in memory. React presents DNS records and saves the ZIP without persisting secrets. Operators configure an ACME account key and an exact external HTTPS origin. A single instance owns each order; a restart invalidates outstanding orders.

**Tech Stack:** Go, golang.org/x/crypto/acme, React/Vite, Vitest and Playwright.

---

1. Add `backend/certificate_acme.go` (ACME adapter) and `backend/certificate_issue.go` (bounded order state and ZIP endpoint); wire `backend/main.go`. Test with an in-process fake ACME service and verify the downloaded key against the leaf certificate (`npm run test:api`).
2. Add the online flow alongside guide and self-signed modes. Add matching translations to all 12 locales. Test the browser workflow with a mocked API and keep existing guide/local coverage (`npm run test:run`, certificate browser suite).
3. Wire runtime configuration in `.env.example`, `docker-compose.yml` and README. Validate production build and prerender (`npm run build`). Live staging issuance requires an operator-controlled DNS name and explicit deployment configuration.

This release performs manual DNS validation for issuance. It does not store domain keys after order expiry, manage DNS provider secrets, or automate renewal.
