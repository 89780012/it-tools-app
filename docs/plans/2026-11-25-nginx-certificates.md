# Nginx Certificate Generator Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a 12-language certificate tool for Nginx: free public certificate deployment instructions and actual local self-signed certificate/private-key generation.

**Architecture:** Client-only tool `nginx-certificate-generator`, registered in crypto alongside certificate-parser. Pure validation and command/config generation in src/lib/nginx-certificate.ts; local Web Crypto and existing @peculiar/x509 generate PEM files. No server ACME account, DNS credentials, private-key storage or automatic external commands.

**Tech Stack:** React, TypeScript, existing shadcn components, Web Crypto, @peculiar/x509, JSZip, Vitest and Playwright.

## Tasks

1. Validate inputs and produce ACME artifacts: domains (ASCII/IDNA, SAN and wildcard), email, RSA/ECDSA, nginx/webroot/cloudflare challenge, staging choice; reject injection, IP/public-name mismatch, bad paths and wildcard HTTP validation. Generate Debian/Ubuntu package setup, issuance command, HTTP bootstrap where required, HTTPS reverse-proxy configuration and systemd renewal/deploy hook. Default to production; explicitly identify staging certificates as untrusted. No manual-DNS renewal trap.
2. Generate local self-signed certificates in browser with secure random serial, SAN, CA=false, serverAuth, RSA-2048 or P-256, 1–365 days, PKCS#8 key, SHA-256 fingerprint; downloadable fullchain.pem, privkey.pem and nginx.conf ZIP. Never display self-signed as publicly trusted. Input changes cancel stale output; no secret persistence or network requests.
3. Add src/app/[locale]/tools/nginx-certificate-generator/page.tsx with accessible labeled modes and steps, error handling, copy/download/reset and related parser link; 12 actual language catalogs under certificate-additions. Register tool and update counts to64/792; sitemap comes from registry.
4. Meaningful tests: shell/config input rejection, domain normalization, wildcard requirements, all challenge/algorithm modes, staging, renewal consistency; verify real generated certificate signature, SAN, dates and key match with Node crypto. Component tests for async cancellation, validation, downloads. Browser clicks through public, wildcard, staging, local RSA/ECDSA, certificate/key/config ZIP verification, all 12 locales, mobile/RTL and clipboard. Run full unit suite, API tests and production build. Recheck final code once; fix concrete findings and retest.

## Acceptance boundaries

Public CA certificates require running generated commands on a domain-controlled server and completing Let's Encrypt validation. This tool must never claim that copied commands have issued a certificate. No live issuance is possible without user-provided domain/server control. Local downloadable certificates are self-signed development certificates only.
