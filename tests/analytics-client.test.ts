import { test } from "node:test";
import assert from "node:assert/strict";
import { createAnalyticsClient } from "../src/lib/analytics-client.ts";

test("no SDK download or event without both configured analytics settings", async () => {
  let loads = 0;
  for (const settings of [{}, {projectToken:"fixture"}, {apiHost:"https://analytics.example"}]) {
    const client = createAnalyticsClient(settings, async () => { loads++; throw new Error("must not load"); });
    client.capture("checkout_clicked", {checkout_domain:"merchant.example"});
    assert.equal(await client.initialize(), null);
  }
  assert.equal(loads,0);
});
test("configured analytics initializes once; early funnel events retain order and properties", async () => {
  let loads = 0, release!: () => void;
  const calls: unknown[][] = [];
  const sdk = {init:(...args:unknown[]) => calls.push(["init",...args]),capture:(...args:unknown[]) => calls.push(["capture",...args])};
  const client=createAnalyticsClient({projectToken:"fixture-public-project",apiHost:"https://analytics.example"},
    async () => {loads++;await new Promise<void>(resolve=>{release=resolve});return sdk;});
  const ready=client.initialize();
  client.capture("chat_opened",{has_attribution:true});
  client.capture("checkout_clicked",{checkout_domain:"merchant.example",product_id:"fixture-product"});
  assert.equal(loads,1);assert.deepEqual(calls,[]);
  release();await ready;await new Promise(setImmediate);
  assert.deepEqual(calls,[
    ["init","fixture-public-project",{api_host:"https://analytics.example",defaults:"2026-05-30",autocapture:false,capture_pageview:false,capture_pageleave:false,disable_session_recording:true}],
    ["capture","chat_opened",{has_attribution:true}],
    ["capture","checkout_clicked",{checkout_domain:"merchant.example",product_id:"fixture-product"}],
  ]);
});
test("SDK load failure does not reject user actions or repeatedly fetch", async () => {
  let loads=0;
  const client=createAnalyticsClient({projectToken:"fixture",apiHost:"https://analytics.example"},
    async()=>{loads++;throw new Error("offline")});
  client.capture("chat_opened",{has_attribution:false});
  assert.equal(await client.initialize(),null);
  client.capture("checkout_clicked",{checkout_domain:"merchant.example"});
  await new Promise(setImmediate);
  assert.equal(loads,1);
});