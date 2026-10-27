# Open Textbook Finder MCP

[![npm](https://img.shields.io/npm/v/open-textbook-finder-mcp.svg)](https://www.npmjs.com/package/open-textbook-finder-mcp)
[![downloads](https://img.shields.io/npm/dm/open-textbook-finder-mcp.svg)](https://www.npmjs.com/package/open-textbook-finder-mcp)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Open Textbook Finder MCP finds free legal copies of textbooks on OpenStax, the Directory of Open Access Books (DOAB) and Open Library by title, ISBN or course topic. It looks up editions by ISBN and suggests older editions that usually cost less.

Use it with Claude Desktop, Claude Code, Cursor, VS Code, Windsurf and any other app that runs a local MCP server. It needs no API key and no account.

Free forever. No account and no subscription.

## What it does

| Tool | Example prompt |
| --- | --- |
| `find_free_textbook` | "Is there a free legal copy of the Calculus textbook by Stewart, or something close to it?" |
| `lookup_isbn` | "Look up ISBN 978-0-13-468599-1 and tell me what other editions exist." |
| `find_older_edition` | "My course wants the 9th edition of Stewart Calculus. Is there an older edition that would work?" |
| `list_open_textbooks_by_subject` | "List free textbooks for intro statistics." |

See [Tools](#tools) for the parameters of each one.

## Install

Run it straight from npm with `npx`. You need Node.js 20 or newer, see [Node version](#node-version) for the details. There is nothing else to install and no config file for the server itself.

```bash
npx -y open-textbook-finder-mcp
```

Add it to your AI app's MCP config so the app can start it for you. Every app reads its config from its own file, so pick yours:

- [Claude Desktop](#claude-desktop)
- [Claude Code](#claude-code)
- [Cursor](#cursor)
- [VS Code](#vs-code)
- [Windsurf](#windsurf)

All of them start the same server the same way. The only difference is where the config goes.

### Claude Desktop

Add this to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "textbooks": {
      "command": "npx",
      "args": ["-y", "open-textbook-finder-mcp"]
    }
  }
}
```

Restart Claude Desktop after you save the file.

### Claude Code

Run this in a terminal:

```bash
claude mcp add textbooks -- npx -y open-textbook-finder-mcp
```

### Cursor

Cursor reads `mcp.json` from the project folder at `.cursor/mcp.json`, or from your home folder at `~/.cursor/mcp.json` if you want the server in every project. On Windows the home folder file is `%USERPROFILE%\.cursor\mcp.json`.

```json
{
  "mcpServers": {
    "textbooks": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "open-textbook-finder-mcp"]
    }
  }
}
```

Restart Cursor after you save the file. The Customize page in the sidebar lists the server once it starts, and you can turn it on or off there.

### VS Code

Put this in `.vscode/mcp.json` in your project folder, or in the `mcp.json` file in your user profile:

```json
{
  "servers": {
    "textbooks": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "open-textbook-finder-mcp"]
    }
  }
}
```

VS Code also reads a portable `.mcp.json` file in the project root. That file uses the name `mcpServers` instead of `servers`:

```json
{
  "mcpServers": {
    "textbooks": {
      "command": "npx",
      "args": ["-y", "open-textbook-finder-mcp"]
    }
  }
}
```

Restart VS Code after you save the file.

### Windsurf

Windsurf reads `mcp_config.json` from `~/.codeium/windsurf/mcp_config.json`. On Windows that is `%USERPROFILE%\.codeium\windsurf\mcp_config.json`.

```json
{
  "mcpServers": {
    "textbooks": {
      "command": "npx",
      "args": ["-y", "open-textbook-finder-mcp"]
    }
  }
}
```

Refresh the list of servers in Windsurf after you save the file.

After any of these, try one of the prompts below.

## Try these three prompts

1. Find a free copy

   > "Is there a free legal copy of the Calculus textbook by Stewart, or something close to it?"

   The model calls `find_free_textbook` with that title. It checks the OpenStax list that ships with the server, then asks DOAB and Open Library. OpenStax Calculus Volume 1 comes back first, and an Open Library result is marked free only when there is a public domain copy to read online.

2. Look up an ISBN

   > "Look up ISBN 978-0-13-468599-1 and tell me what other editions exist."

   `lookup_isbn` checks the check digit first, then returns the title, publisher, publish date and page count from Open Library. It also lists the other editions of the same book, newest first.

3. Find a cheaper older edition

   > "My course wants the 9th edition of Stewart Calculus. Is there an older edition that would work?"

   `find_older_edition` lists the earlier editions of the book, closest first, with the year, the edition name and the ISBN when Open Library has them. Pass `edition_year` to say which edition your course asks for.

More things you can ask:

- "List free textbooks for intro statistics."
- "Is there a free textbook for nursing pharmacology?"
- "Find a free legal copy of Pride and Prejudice."
- "Which free textbooks cover microeconomics?"
- "I have the ISBN 9780134685991. Is there a free copy of that book?"
- "Is the 7th edition close enough to the 9th for an intro physics course?"

## Tools

Four tools. These names are the ones your AI app sees.

| Tool | Parameters | What it does |
| --- | --- | --- |
| `find_free_textbook` | `query`, `limit` | Search OpenStax, DOAB and Open Library for a free legal copy by title, ISBN or course topic. Open Library results are marked free for a public domain copy and borrow for a free loan |
| `lookup_isbn` | `isbn` | Return the edition details for an ISBN, say whether a free copy is known and list the related editions of the same book |
| `list_open_textbooks_by_subject` | `subject`, `limit` | Browse free textbooks for a course topic from OpenStax and DOAB |
| `find_older_edition` | `query`, `edition_year`, `limit` | Suggest earlier editions of a textbook that usually cost less, closest to the current edition first |

Every tool description sent to your AI app ends with one example prompt, so the model can match a question like "Is there a free copy of this book?" to the right tool and fill in every parameter.

Every tool also returns its results as structured data. Each tool has an output schema, so a client that reads JSON gets fields such as `results` or `suggestions` straight away, and the text answer stays the same for an app that only reads words. The fields each tool returns are listed in [llms.txt](llms.txt) and in [glama.json](glama.json).

## Where the books come from

| Source | What it gives | How it is searched |
| --- | --- | --- |
| OpenStax | Free peer reviewed college textbooks | A list of OpenStax titles ships with the server and is matched on your computer, because OpenStax has no public search service |
| DOAB | Open access academic books, with the licence when DOAB lists one | The DOAB search service |
| Open Library | Edition records, and public domain or borrowable copies at the Internet Archive | The Open Library search and edition services |

A result has an `access` value. `free` means a copy you can read online or keep, `borrow` means a free loan that you have to return, and `none` means no free copy is known. Always check the licence on the page you land on before you reuse a book.

## FAQ

Does it need an API key?

No. Open Library and DOAB can be searched without a key, and the OpenStax list ships with the server.

Does it find pirated copies?

No. It only returns OpenStax, DOAB and Open Library records, which are open licensed, public domain or legal loans.

What if I only have an ISBN?

Pass it to `find_free_textbook` or `lookup_isbn`. Hyphens and spaces are fine. The check digit is tested first, so a typo is reported as a bad ISBN instead of a search that finds nothing.

Can it tell me the price of an older edition?

No. The tool does not know prices, because no free price service exists. It tells you which earlier editions exist so you can check a used book seller yourself.

Will an older edition match my course?

Often an edition one or two releases back keeps the same chapters, but publishers reorder problems and drop sections. Compare the table of contents with your syllabus and ask your instructor before you buy.

What happens if one source is down?

The other sources still answer, and the reply names the source that did not. If every source is down the tool says so instead of returning an empty list.

## How it compares

| Option | Needs a key or account | Covers | When to use |
| --- | --- | --- | --- |
| Open Textbook Finder MCP (this server) | No | OpenStax, DOAB and Open Library in one question, plus ISBN and edition lookups | You want your AI app to check the free options before you buy a book. |
| Searching each site yourself | No | One site at a time | You already know which site has your book. |
| Course platform MCPs (Brightspace, Canvas, Moodle, Google Classroom) | Your account on that platform | Due dates, grades, missing work and course files from one LMS | You want your AI app to read your course platform, not to find books. |

Open Textbook Finder MCP is a free textbook MCP: it needs no key and no account, and it finds legal copies of textbooks on OpenStax, DOAB and Open Library. The course platform MCPs above connect to your LMS account and show what is due, what is missing and what you have earned. They do not search for textbook copies. You can run both side by side, since they read different things and neither needs a key.

## Node version

There are two floors here, and they are not the same number.

| What you are doing | Node.js |
| --- | --- |
| Running the published server | 20 or newer |
| Building and testing a clone | 22.12 or newer, on the 22 and 24 release lines or 26 and later |

The server itself is happy on Node.js 20, and that is what `engines` in package.json says. The test runner wants a newer Node.js, so the development floor lives in `devEngines` in the same file. npm checks `devEngines` before install, run and test, so a clone on Node.js 20 stops with a clear message instead of a strange failure part way through the test suite. The 23 and 25 release lines are left out on purpose, because the test runner does not run on them.

Both numbers live in package.json, and a test in `tests/node-version.test.ts` keeps them in step with the README and with the range the test runner asks for.

## Development

```bash
npm install
npm run build
npm test
```

The tests call every tool through a real MCP client with a fake network, so they need no account, no key and no internet. They need the newer Node.js from the Node version section above, because of the test runner.

## Privacy

There is no key, no login and no account. The server sends your search text or ISBN to two public services and nothing else: `openlibrary.org` and `directory.doabooks.org`. The OpenStax match runs on your computer and sends nothing. The server writes no files, keeps no history and has no analytics. Each request carries a User-Agent header with the package name and the repository address, which Open Library asks of every client. Those services have their own privacy policies for the requests they receive.

## More free student MCP servers

All free, open source and read only where they touch your accounts. Browse the full list at [brightspacemcp.com/more-mcps](https://brightspacemcp.com/more-mcps/).

| Server | What it does |
| --- | --- |
| [Brightspace MCP](https://github.com/AnonymousOnyx22/brightspace-d2l-mcp) | D2L Brightspace for AI. Due dates with real submission status, grades, a target grade calculator and course files. |
| [Canvas MCP](https://github.com/AnonymousOnyx22/canvas-lms-student-mcp) | Canvas LMS for AI, read only. Due dates, missing work, grades and announcements. |
| [Moodle MCP](https://github.com/AnonymousOnyx22/moodle-student-mcp) | Moodle for AI, read only. Due dates, overdue work, grades and announcements. |
| [Google Classroom MCP](https://github.com/AnonymousOnyx22/google-classroom-student-mcp) | Google Classroom for AI, read only. Todos, due dates, missing work and grades. |
| [GPA Calculator MCP](https://github.com/AnonymousOnyx22/gpa-calculator-mcp) | GPA, CGPA, weighted grades, target grades and final exam math. Works offline. |
| [Citations MCP](https://github.com/AnonymousOnyx22/student-citations-mcp) | APA, MLA and Chicago citations from a DOI, an ISBN or typed details. No account. |
| [Study Planner MCP](https://github.com/AnonymousOnyx22/study-planner-mcp) | Exam study schedules, spaced repetition dates, pomodoro plans and assignment milestones. Works offline. |
| [Paper Finder MCP](https://github.com/AnonymousOnyx22/paper-finder-student-mcp) | Search scholarly papers, find open access copies and related work through OpenAlex. No key needed. |

## License

MIT
