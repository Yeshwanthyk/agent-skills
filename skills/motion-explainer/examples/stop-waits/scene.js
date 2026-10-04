// A restart race, after Kit Langton's opencode #50042 explainer. The code is illustrative.
mx.scene({
  title: ["#50042", "stop waits for the process"],
  highlight: ["disappear", "returned early,", "SIGKILL", "binds cleanly."],
}, (s) => {
  s.act("before the fix", 0, { tone: "coral" });
  s.box("cli", "opencode restart", { at: [1.6, 1.2], status: "restarting", spin: true, enter: "before" });
  s.box("stop", "stop()", { at: [1.6, 3.4], status: "idle", enter: "before+0.2", inspect: "Stops the running server before a restart starts a new one." });
  s.box("file", "service.json", { at: [6, 1.2], status: "pid 4182 · port 4096", enter: "service", inspect: "Written by the server at boot, deleted during shutdown." });
  s.orb("old", "old server", { at: [9.6, 3], r: 80, status: "pid 4182 · serving", enter: "old", inspect: "The process still holds port 4096 until it exits." });
  s.wire("cli", "stop", { enter: "before+0.4" });
  s.wire("stop", "file", { id: "read", enter: "read-0.3" }).send("read", "read").send("find+0.2", "pid 4182", { back: true });

  // the race: the file goes first, the process lingers
  s.el("old").set("but", { status: "pid 4182 · shutting down", tone: "amber" });
  s.el("file").set("disappear", { status: "deleted", tone: "coral" });
  s.callout("file", "race", "file gone, process alive", { enter: "disappear+0.3", exit: "after-0.4" });
  s.el("read").send("saw", "read").fail("no+0.35");
  s.el("stop").set("returned", { status: "returned early", tone: "coral" });
  s.box("new", "new server", { at: [6, 5], status: "binding :4096", enter: "restart" })
    .set("collided", { status: "EADDRINUSE", tone: "coral" });
  s.wire("new", "old", { id: "bind", enter: "restart+0.3" }).fail("collided");

  // rewind to the calm before the race, then replay with the fix
  s.rewind("after-0.3", "server+0.6", { dur: 1.3 });
  s.act("after the fix", "watches-0.2", { tone: "green" });
  s.el("stop").set("watches", { status: "watching pid 4182", tone: "amber" });
  s.wire("stop", "old", { id: "watch", enter: "watches" }).send("signalled", "SIGTERM");
  const grace = s.at("out") - s.at("watches");
  s.gauge("grace", "grace", 5, { at: [9.6, 5.4], unit: "s", enter: "watches+0.2", inspect: "How long stop waits for a clean exit before SIGKILL." })
    .set("watches+0.4", { value: 0 }, { dur: grace }).set("out", { tone: "coral" }, { dur: 0.2 });
  s.el("watch").send("sigkill", "SIGKILL", { tone: "coral", dur: 0.6 });
  s.el("old").set("out", { status: "pid 4182 · killed", tone: "coral" }, { dur: 0.2 }).burst("out").exit("out+0.6");
  s.el("watch").exit("out+0.6");
  s.el("stop").set("new", { status: "process exited", tone: "green" });
  s.box("fresh", "new server", { at: [6, 5], status: "bound :4096", tone: "green", enter: "new" });
  s.el("cli").set("binds", { status: "restarted", spin: "ok", tone: "green" });

  // the code
  s.act("the code", "here");
  for (const id of ["cli", "stop", "file", "fresh", "grace", "watch", "read"]) s.el(id).exit("here", { dur: 0.3 });
  s.diff("patch", "src/server/stop.ts", [
    "export async function stop(signalled?: number) {",
    "-  const svc = await readServiceJson()",
    "-  if (!svc) return",
    "-  process.kill(svc.pid, \"SIGTERM\")",
    "+  const pid = signalled ?? (await readServiceJson())?.pid",
    "+  if (!pid) return",
    "+  process.kill(pid, \"SIGTERM\")",
    "+  await waitForExit(pid, { grace: 5_000, then: \"SIGKILL\" })",
    "}",
  ], { enter: "here+0.3" }).note("whole+0.2", 7, "<em>watch the pid</em>, not the file").apply("change+0.6");
  s.end("change+3.2");
});
