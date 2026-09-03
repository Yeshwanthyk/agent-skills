# Calldiff

Use `calldiff` when the question is how a code change alters a call tree or call stack.

```bash
calldiff diff                                      # HEAD vs working tree
calldiff diff main                                 # branch vs working tree
calldiff diff abc123 def456                        # two commits
calldiff diff main feature --entry submitForm      # force entrypoint
calldiff diff main feature --file src/routes.ts    # all exports in a file
```

For one tree without a diff:

```bash
calldiff tree --entry <symbol>
calldiff tree --file <path>
```

Show the command, the smallest useful output slice, and one sentence explaining the changed path. If `calldiff` is unavailable or cannot parse the project, use a source-grounded manual call tree and state the limitation.
