---
name: notify
description: "Alert the user on their Mac with a chime and an on-screen dialog. Use when they ask to be notified, pinged, or told when something finishes: a CI check, a deploy, a merge becoming possible, a background command."
---

# Notify

Hosts have no agent tool that reaches the user's desktop; a chat reply waits until they look at the thread. [`scripts/notify.sh`](scripts/notify.sh) raises a banner with a chime and a dialog that stays until they click OK, because banners alone often land silently in Notification Center.

```sh
scripts/notify.sh "PR 5 ready" "Onion deploy passed. #37175 is good to merge."
scripts/notify.sh --quiet "Test" "This is how alerts look."   # banner only
```

## Steps

1. **Name the finish line.** Turn the user's ask into one observable state, with its source: a commit status context, a PR's merge state, a command's exit. "Good to merge" usually means several states at once (checks green, approved, base unlocked, a dependency deployed); check each.
2. **Watch it in the background.** Run one background command that polls the source until the state leaves pending, then calls `notify.sh` with the outcome. Match the poll interval to how fast the state changes (30–60s for CI and deploys). Report a failure as loudly as a success:

   ```sh
   until s=$(gh api repos/OWNER/REPO/commits/SHA/status \
       --jq '.statuses[]|select(.context=="CONTEXT")|.state'); \
       [ -n "$s" ] && [ "$s" != pending ]; do sleep 30; done
   if [ "$s" = success ]; then msg="CONTEXT passed. NEXT STEP."; else msg="CONTEXT ended $s. Look before NEXT STEP."; fi
   scripts/notify.sh "SHORT TITLE" "$msg"
   ```

   Give the command a timeout longer than the wait. In T3 Code, register it with `t3_background_wait` so the thread stays working and you are woken to report in chat too.
3. **Confirm on wake.** Re-read the state yourself, tell the user in chat what finished and what they can do now, and stop any watcher you no longer need.

Before the first real alert in a session, offer a `--quiet` test. If the banner never shows, the user enables alerts for Script Editor in System Settings → Notifications; the dialog appears either way.

Done means the user got an alert naming the outcome and the next action, and the chat says the same.
