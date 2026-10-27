# Changelog

## Unreleased

- The first screen of the README now leads with the problem, a one line install and three example prompts for faster setup.
- The README now compares the server against course platform MCPs (Brightspace, Canvas, Moodle and Google Classroom), so a searcher can see that this server finds free textbook copies while those servers read a course platform account.

## 0.1.0

- First release. Open Textbook Finder MCP finds free legal textbooks from OpenStax, the Directory of Open Access Books (DOAB) and Open Library, with no API key and no account.
- Added `find_free_textbook`, which searches the three sources by title, ISBN or course topic. Open Library results are marked free for a public domain copy and borrow for a free loan.
- Added `lookup_isbn`, which tests the check digit, returns the edition details from Open Library and lists the other editions of the same book.
- Added `list_open_textbooks_by_subject`, which browses OpenStax and DOAB for a course topic.
- Added `find_older_edition`, which lists earlier editions of a textbook, closest to the current edition first.
- Every tool has an output schema and returns its results as fields next to the text answer.
- A source that is down no longer stops the others. The reply names the source that did not answer.
- Added tests for every tool that run against a fake network, plus tests that keep the README, llms.txt, glama.json and the package files in step with the code.
