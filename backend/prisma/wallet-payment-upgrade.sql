create extension if not exists pgcrypto;

create table if not exists "PaymentSetting" (
  "id" uuid primary key default gen_random_uuid(),
  "provider" text not null unique,
  "enabled" boolean not null default false,
  "priority" integer not null default 100,
  "configJson" text not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists "AdminFinancialLog" (
  "id" uuid primary key default gen_random_uuid(),
  "adminId" text not null,
  "actionType" text not null,
  "targetUserId" text,
  "amount" numeric,
  "currency" text,
  "reason" text,
  "transactionId" text,
  "createdAt" timestamptz not null default now()
);

alter table "WalletTransaction"
  add column if not exists "currency" text not null default 'USD',
  add column if not exists "provider" text,
  add column if not exists "providerRefId" text,
  add column if not exists "proofUrl" text,
  add column if not exists "metadataJson" text,
  add column if not exists "updatedAt" timestamptz not null default now();

create index if not exists "WalletTransaction_provider_idx" on "WalletTransaction" ("provider");
create index if not exists "WalletTransaction_providerRefId_idx" on "WalletTransaction" ("providerRefId");
