import { test } from "node:test";
import assert from "node:assert/strict";
import { promoImagePublicPath } from "./promo-image.js";

test("veřejná cesta reklamy je na webu pod /uploads/promos", () => {
  assert.equal(promoImagePublicPath(7), "/uploads/promos/7");
  assert.equal(promoImagePublicPath(7, new Date(1_700_000_000_000)), "/uploads/promos/7?v=1700000000000");
});
