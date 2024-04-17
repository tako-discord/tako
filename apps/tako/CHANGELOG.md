## 2.0.0-alpha.7

### Patch Changes

- Added error handling that logs the error in `bot.log` instead of exiting the code.
- Move everything to a monorepo. Run `bun install` and `bun start` to get started with the new repo. Also be aware that the codebase has been moved to `apps/tako` and thus your `.env.production` needs to be there as well.
- Updated dependencies
  - @repo/typescript-config@1.0.1-alpha.0

## 2.0.0-alpha.6 (2024-04-13)

### Feat

- **info/roleInfo**: add role icons url

### Fix

- **commands/userInfo**: fixed wrong display when the avatar is animated

## 2.0.0-alpha.5 (2024-04-13)

### Feat

- **commands/info**: add roleInfo

### Fix

- **utility/emojis**: fetch emojis instead of using cache

## 2.0.0-alpha.4 (2024-04-13)

### Feat

- **commands/utility**: add emoji list command

### Perf

- **secret/sync**: removed unused imports

## 2.0.0-alpha.3 (2024-04-12)

### Fix

- **util/general**: fixed unexpected returned language value

## 2.0.0-alpha.2 (2024-04-12)

### Fix

- **utility/autoRoles**: fix autoroles list failing when there are no roles
- **utility/autoReact**: support for forums & threads + limit channel types

## 2.0.0-alpha.1 (2024-04-06)

### Feat

- **commands/info**: add help command
- **commands/utility**: add autoroles
- **commands**: add auto-react
- **commands/info**: add user info for context menu apps
- add support for user installable apps
- **info/user**: add guild specific avatar & regular banner
- **commands/fun**: add /ip command & move uwuify to the fun category
- **util/badges**: make it universal to add new role-based badge
- **commands/info**: add tako badges
- **utility**: add feedback command
- **commands/utility**: add quick translate
- **commands/info**: add urban-dictionary command
- **commands/urban-dictionary**: add autocomplete
- **i18n**: dynamically load translations
- **commands/stickyMessages**: implement db update on modal submit
- **commands/info**: init urban-dictionary command
- **commands/utility**: add change-language commands (personal & server-wide)
- **commands/misc**: add uwuify command
- **prisma**: add channel model
- **commands/sticky-message**: localize command data
- **commands/ping**: localize command data
- **commands/info**: localize command data
- **i18n**: add support for command translation
- **commands/utility**: add sticky-messages subcommand group (incomplete)
- **commands/sync**: add sync command (devs only)
- **commands/info**: add `/info user` command
- **prisma**: add support to use the database

### Fix

- **events/ready**: fix slash command notice activity type
- **commands/info**: make help command ephemeral
- **commands/autoReact**: default member permission & require GUILD_INSTALL
- **info/badge**: fix type when the badge option is null
- **i18n/de/badges**: fix incorrect variables being used
- **commands/info/badge**: fix links not being passed into badge descriptions
- **utils/createEmbed**: fix emojis not appearing in embeds + using markdown titles for the title now instead of the title field
- **types**: make footer optional
- **commands**: add default permissions for destructive actions
- **commands/info**: fix user info not respecting user option
- **util/info**: fix missing translation keys
- **commands/sync**: fix sync command not syncing and not replying to interaction
- **util/general**: fix unnecessary whitespace in createEmbed() when no emoji was given
- **commands/ping**: proper i18n for ping command
- **util/checks**: use config for devs instead of non-working `client.application.owner`

### Refactor

- **events/ready**: switch to custom status/activities
- **commands/stickyMessages**: unload sticky messages, as it's a wip
- **util/logger**: improve logger transport to fix a lint problem
- **commands/quickTranslate**: move the original message link to a button
- **commands/utility**: rename change-language -> set-language
- **commands/info**: move user info to utils
- moving commands to categories/folders (partly broken)
- **commands/sync**: better and localized dev check
- **util/logger**: rename log -> logger

### Perf

- **commands/secret/sync**: removed unused variables and better deploying
