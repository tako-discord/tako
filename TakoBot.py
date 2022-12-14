import os
import i18n
import json
import config
import random
import logging
import discord
import aiohttp
import bot_secrets
import persistent_views
from datetime import datetime
from discord.ext import commands, tasks

try:
    import tomllib
except ModuleNotFoundError:
    import tomli as tomllib

trimmer = "\033[90m----------\033[0m"
start_time = datetime.now()
ascii_art = """
\033[93m$$$$$$$$\        $$\                 
\__$$  __|       $$ |                
   $$ | $$$$$$\  $$ |  $$\  $$$$$$\  
   $$ | \____$$\ $$ | $$  |$$  __$$\ 
   $$ | $$$$$$$ |$$$$$$  / $$ /  $$ |
   $$ |$$  __$$ |$$  _$$<  $$ |  $$ |
   $$ |\$$$$$$$ |$$ | \$$\ \$$$$$$  |
   \__| \_______|\__|  \__| \______/\033[0m
"""


class TakoBot(commands.Bot):
    async def on_ready(self):
        if self.initialized:
            return
        print(
            f"\033[1F\033[2Kš \033[90m|\033[0m \033[93mLogged in as {self.user.name} (ID: {self.user.id})\033[0m"
        )
        print(trimmer)
        print(
            f"\033[90m>\033[0m Startup took {round((datetime.now() - start_time).total_seconds(), 2)}s"
        )
        print("\033[90m>\033[0m Now running and listening to commands")
        print("\033[90m>\033[0m Everything will be logged to discord.log")
        print("\033[90m>\033[0m Press CTRL+C to exit")
        print(trimmer)
        self.initialized = True

    async def setup_hook(self):
        print(ascii_art)
        print(trimmer)
        self.initialized = False
        logger = logging.getLogger("startup")
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            "{status} \033[90m|\033[0m {message}",
            style="{",
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

        logger.info("\033[94mLoading cogs\033[0m", extra={"status": "š"})
        categories = 0
        for category in os.listdir("cogs"):
            categories += 1
            await self.load_extension(f"cogs.{category}")
        logger.info(
            f"\033[92mLoaded {len(self.cogs)} cogs from {categories} categories\033[0m",
            extra={"status": "\033[1F\033[2Kā"},
        )
        logger.info("\033[94mLoading i18n\033[0m", extra={"status": "š"})
        i18n.set("filename_format", "{locale}.{format}")
        i18n.set("fallback", "en")
        i18n.load_path.append("i18n")
        locales = []
        for locale in os.listdir("i18n/misc"):
            locales.append(locale.split(".")[0])
        logger.info("\033[92mLoaded i18n\033[0m", extra={"status": "\033[1F\033[2Kā"})
        logger.info(
            f"\033[92mAvailable locales ({len(locales)}): {', '.join(locales)}\033[0m",
            extra={"status": "ā"},
        )
        logger.info("\033[94mUpdating suspicious domains\033[0m", extra={"status": "š"})
        self.update_phishing_list.start()
        logger.info(
            "\033[92mUpdated suspicious domains\033[0m",
            extra={"status": "\033[1F\033[2Kā"},
        )
        if hasattr(bot_secrets, "UPTIME_KUMA"):
            self.uptime_kuma.start()
        self.postgre_guilds = await self.db_pool.fetch("SELECT * FROM guilds")
        logger.info("\033[94mAdding persistent views\033[0m", extra={"status": "š"})
        await persistent_views.setup(self)
        logger.info(
            "\033[92mAdded persistent views\033[0m", extra={"status": "\033[1F\033[2Kā"}
        )
        self.presence_update.start()
        self.badges_update.start()
        self.update_version.start()
        logger.info("\033[94mLogging in...\033[0m", extra={"status": f"{trimmer}\nš"})

    @tasks.loop(seconds=55)
    async def uptime_kuma(self):
        async with aiohttp.ClientSession() as cs:
            await cs.get(bot_secrets.UPTIME_KUMA + str(round(self.latency * 1000)))
            return

    @uptime_kuma.before_loop
    async def before_uptime_kuma(self):
        await self.wait_until_ready()

    @tasks.loop(hours=1)
    async def update_version(self):
        with open("pyproject.toml", "rb") as f:
            self.version = tomllib.load(f)["tool"]["commitizen"]["version"]

    @tasks.loop(hours=1)
    async def update_phishing_list(self):
        self.sussy_domains = []
        if hasattr(config, "ANTI_PHISHING_LIST"):
            async with aiohttp.ClientSession() as cs:
                for list in config.ANTI_PHISHING_LIST:
                    async with cs.get(list) as r:
                        r = await r.read()
                        r = json.loads(r)
                        self.sussy_domains.extend(r["domains"])

    @tasks.loop(seconds=7.5)
    async def presence_update(self):
        presences = [
            {"name": "with the new rewrite", "type": discord.ActivityType.playing},
            {
                "name": f"over {len(self.guilds)} server{'s' if len(self.guilds) > 1 else ''}",
                "type": discord.ActivityType.watching,
            },
            {
                "name": f"{len(self.users)} user{'s' if len(self.users) > 1 else ''}",
                "type": discord.ActivityType.listening,
            },
            {
                "name": f"{len(self.tree.get_commands())} {'commands' if len(self.tree.get_commands()) > 1 else 'command'}",
                "type": discord.ActivityType.listening,
            },
            {
                "name": "/ commands",
                "type": discord.ActivityType.listening,
            },
            {
                "name": f"with version {self.version}",
                "type": discord.ActivityType.playing,
            },
            {
                "name": "translate at translate.tako-bot.com",
                "type": discord.ActivityType.playing,
            },
        ]
        random_presence = random.choice(presences)
        await self.change_presence(
            activity=discord.Activity(
                type=random_presence["type"], name=random_presence["name"]
            )
        )

    @presence_update.before_loop
    async def before_presence_update(self):
        await self.wait_until_ready()

    @tasks.loop(hours=1)
    async def badges_update(self):
        for guild in self.guilds:
            for role in guild.roles:
                if role.id == config.DONATOR_ROLE:
                    users = []
                    for member in role.members:
                        users.append(member.id)
                    await self.db_pool.execute(
                        "UPDATE badges SET users = $1 WHERE name = 'donator';", users
                    )
                    continue
                if role.id == config.TRANSLATOR_ROLE:
                    users = []
                    for member in role.members:
                        users.append(member.id)
                    await self.db_pool.execute(
                        "UPDATE badges SET users = $1 WHERE name = 'translator';", users
                    )
                    continue
                if role.id == config.ALPHA_TESTER_ROLE:
                    users = []
                    for member in role.members:
                        users.append(member.id)
                    await self.db_pool.execute(
                        "UPDATE badges SET users = $1 WHERE name = 'alpha_tester';",
                        users,
                    )
                    continue
                if role.id == config.DEV_ROLE:
                    users = []
                    for member in role.members:
                        users.append(member.id)
                    await self.db_pool.execute(
                        "UPDATE badges SET users = $1 WHERE name = 'core_developer';",
                        users,
                    )
                    continue

    @badges_update.before_loop
    async def before_badges_update(self):
        await self.wait_until_ready()
