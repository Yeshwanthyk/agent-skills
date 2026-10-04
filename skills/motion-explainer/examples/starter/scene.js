// Starter: replace the narration, then rebuild this flow around it. BLOCKS.md lists every block.
mx.scene({
  title: ["#starter", "a cache miss"],
  highlight: ["cache first.", "flows back."],
}, (s) => {
  s.act("request", 0);
  s.box("client", "client", { at: [1.5, 3], status: "GET /user/42", enter: "request" });
  s.box("gateway", "gateway", { at: [5, 3], status: "routing", spin: true, enter: "gateway",
    inspect: { body: "Routes each request; owns the cache lookup.", cite: "src/gateway.ts:12" } });
  s.wire("client", "gateway", { enter: "request+0.3" }).send("reaches", "GET");

  s.act("lookup", "checks-0.2");
  s.box("cache", "cache", { at: [5, 0.9], status: "42 → ?", enter: "checks" });
  s.wire("gateway", "cache", { id: "lookup", enter: "cache" }).send("cache+0.2", "get 42").fail("miss");
  s.el("cache").set("miss", { status: "miss", tone: "coral" });

  s.orb("db", "database", { at: [9.2, 3], r: 80, status: "users", enter: "database-0.4" });
  s.wire("gateway", "db", { id: "query", enter: "asks" }).send("database", "SELECT").send("answer", "row 42", { back: true, tone: "green" });
  s.el("gateway").set("flows", { status: "200 OK", spin: "ok", tone: "green" });
  s.el("client").set("back", { status: "user 42", tone: "green" });
  s.callout("db", "source of truth", "the cache only mirrors it", { enter: "back+0.4" });
});
