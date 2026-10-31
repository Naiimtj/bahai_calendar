---
description: 'Record a thought related to the current project'
tools: [read, edit]
name: 'thought'
# Generated from .github/MODELS.md by .github/scripts/sync-agent-models.sh. Do not edit.
model: ["GPT-5.6 Luna", "GPT-5.3-Codex"]
---

# /thought - Quick Thought Capture

## Command Usage

Use `/thought` to capture quick thoughts, ideas, and notes with timestamps in a centralized thoughts file.

**Syntax:**

- `/thought --help` or `/thought -h` - Display help information. Display the available parameters and their usage. On top, start with a simple list of all available parameters, parameters only. E.g. --help, --recent
- `/thought <your note or idea>` - Add a thought
- `/thought --recent` or `/thought -r` - View recent thoughts

## Purpose

Document fleeting ideas, reminders, and observations during development work without interrupting flow. All thoughts are collected in a single chronological file with timestamps.

## When to Use /thought

Invoke this command to:

- Capture quick ideas or observations during development
- Document reminders for future work
- Record insights without breaking focus
- Review recent thoughts and notes

## Command Execution Summary

When the user types `/thought <note>` or `/thought --recent`, follow the detailed workflow below.

## File Location and Naming

- **Directory**: `.history/thoughts/`
- **Filename**: `thoughts.md`
- **Path**: `.history/thoughts/thoughts.md`
- **Format**: Single chronological file with timestamped entries

## Command Details

### Adding a Thought

When the user types `/thought` followed by their note:

1. **Extract the note content**: Everything after `/thought` is the note text
2. **Generate timestamp**: Use the current date/time from context in the format `[YYYY.MM.DD HH:MM:SS]`. Do NOT use tools to get the timestamp.
3. **Locate or create the thoughts file**:
   - File path: `.history/thoughts/thoughts.md`
   - Create the directory structure if it doesn't exist
4. **Append the timestamped note**: Use an available file-editing tool to add one line in this format:
   ```
   [YYYY.MM.DD HH:MM:SS] <note content>
   ```
5. **Auto-save Model Usage**:
   - Read current `.history/model_usage.md` file
   - Use an available file-editing tool to append a new table entry
   - Include all required columns: Timestamp, Model, Input/Reasoning/Output/Total Tokens, Files Read/Created/Modified, Summary
   - Use only file-editing tools, never terminal commands
   - If exact token values are not exposed by the runtime, write `unavailable`; never estimate or invent them
6. **File Handling**:
   - Do not open edited files in the editor
   - Do not attempt UI keystrokes or automate Keep/Undo controls
7. **Confirm**: Briefly confirm that the thought was captured.

### Viewing Recent Thoughts

Accept only the documented `--recent` or `-r` option.
When the user types `/thought --recent` or `/thought -r`:

1. **Read the thoughts file**: Read `.history/thoughts/thoughts.md`
2. **Extract last 5 entries**: Get the last 5 lines from the file
3. **Display in chat**: Show the recent thoughts in the chat window with a simple header
4. **Handle edge cases**:
   - If the file doesn't exist, inform the user no thoughts have been captured yet
   - If there are fewer than 5 thoughts, show all available thoughts

## Example

### Adding a Thought

**User input:**

```
/thought Add the juicer functionality.
```

**Action:** Append to `.history/thoughts/thoughts.md`:

```
[2025.11.19 15:03:34] Add the juicer functionality.
```

**Response:**

```
Thought captured.
```

### Viewing Recent Thoughts

**User input:**

```
/thought recent
```

**Action:** Read and display last 5 entries from `.history/thoughts/thoughts.md`

**Response:**

```
Recent thoughts:

[2025.11.19 14:32:15] Review the authentication flow
[2025.11.19 14:45:22] Consider adding rate limiting
[2025.11.19 15:03:34] Add the juicer functionality
[2025.11.19 15:12:08] Update documentation for API endpoints
[2025.11.19 15:20:41] Test edge cases in validation logic
```

## Notes

- Each thought is a single line entry
- Thoughts are appended chronologically (newest at the bottom)
- The file path is relative to the workspace root
- When adding thoughts, read enough of the existing file to append safely without replacing prior entries
- When viewing recent thoughts, read from the end of the file
- Keep confirmation messages brief for additions
- For viewing recent thoughts, display them clearly without extra commentary
