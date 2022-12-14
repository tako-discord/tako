import io
import os
import i18n
import discord
from ftlangdetect import detect
from discord import app_commands
from discord.ext import commands
from discord.app_commands import Choice
from utils import get_language, translate, error_embed


class AutoTranslate(commands.GroupCog, name="auto_translate"):
    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(description="Disable or enable auto translate")
    @app_commands.describe(value="Whether to enable or disable auto translate")
    @app_commands.checks.has_permissions(manage_guild=True)
    async def toggle(self, interaction: discord.Interaction, value: bool):
        await self.bot.db_pool.execute(
            "INSERT INTO guilds (guild_id, auto_translate) VALUES ($1, $2) ON CONFLICT(guild_id) DO UPDATE SET auto_translate = $2",
            interaction.guild.id,
            value,
        )
        return await interaction.response.send_message(
            i18n.t(
                f"misc.auto_translate_{'activated' if value else 'deactivated'}",
                locale=get_language(self.bot, interaction.guild.id),
            ),
            ephemeral=True,
        )

    @app_commands.command(description="Set the style of the auto translated message")
    @app_commands.describe(style="The style of the auto translated message")
    @app_commands.checks.has_permissions(manage_guild=True)
    @app_commands.choices(
        style=[
            Choice(name="Default", value="default"),
            Choice(name="Webhook", value="webhook"),
            Choice(name="Minimal Webhook", value="min_webhook"),
        ]
    )
    async def style(self, interaction: discord.Interaction, style: str):
        await self.bot.db_pool.execute(
            "INSERT INTO guilds (guild_id, auto_translate_reply_style) VALUES ($1, $2) ON CONFLICT(guild_id) DO UPDATE SET auto_translate_reply_style = $2",
            interaction.guild.id,
            style,
        )
        return await interaction.response.send_message(
            i18n.t(
                "misc.auto_translate_reply_style_set",
                style=style,
                locale=get_language(self.bot, interaction.guild.id),
            ),
            ephemeral=True,
        )

    @app_commands.command(
        description="Adjust the confidence threshold for auto translate"
    )
    @app_commands.describe(value="The confidence threshold for auto translate.")
    @app_commands.checks.has_permissions(manage_guild=True)
    async def sensitivity(
        self, interaction: discord.Interaction, value: app_commands.Range[int, 0, 100]
    ):
        await self.bot.db_pool.execute(
            "INSERT INTO guilds (guild_id, auto_translate_confidence) VALUES ($1, $2) ON CONFLICT(guild_id) DO UPDATE SET auto_translate_confidence = $2;",
            interaction.guild.id,
            value,
        )
        return await interaction.response.send_message(
            i18n.t(
                "misc.auto_translate_confidence_set",
                value=value,
                locale=get_language(self.bot, interaction.guild.id),
            ),
            ephemeral=True,
        )

    @app_commands.command(
        description="Toggle original message deletion for auto translate"
    )
    @app_commands.describe(value="Whether to delete the original message or not")
    async def delete_original(self, interaction: discord.Interaction, value: bool):
        await self.bot.db_pool.execute(
            "INSERT INTO guilds (guild_id, auto_translate_delete_original) VALUES ($1, $2) ON CONFLICT(guild_id) DO UPDATE SET auto_translate_delete_original = $2;",
            interaction.guild.id,
            value,
        )
        return await interaction.response.send_message(
            i18n.t(
                "misc.auto_translate_delete_original",
                value=value,
                locale=get_language(self.bot, interaction.guild.id),
            ),
            ephemeral=True,
        )

    @commands.Cog.listener()
    async def on_message(self, message: discord.Message):
        try:
            state = await self.bot.db_pool.fetchval(
                "SELECT auto_translate FROM guilds WHERE guild_id = $1",
                message.guild.id,
            )
        except AttributeError:
            return
        if (
            not message.content
            or not state
            or message.author.id == self.bot.user.id
            or message.webhook_id
        ):
            return
        attachments: list[dict] = []
        if message.attachments:
            for attachment in message.attachments:
                bytes = await attachment.read()
                attachments.append(
                    {
                        "bytes": bytes,
                        "spoiler": attachment.is_spoiler(),
                        "filename": attachment.filename,
                        "description": attachment.description,
                    }
                )
        size = 0
        boost_level = message.guild.premium_tier if hasattr(message, "guild") else 0
        size_limit = 8000000
        match boost_level:
            case 2:
                size_limit = 50000000
            case 3:
                size_limit = 100000000
        new_attachments = []
        attachment_removed = False
        for attachment in attachments:
            file_size = len(attachment["bytes"])
            size += file_size
            if size > size_limit:
                size -= file_size
                attachment_removed = True
                continue
            attachment_bytes = io.BytesIO(attachment["bytes"])
            new_attachments.append(
                discord.File(
                    attachment_bytes,
                    spoiler=attachment["spoiler"],
                    filename=attachment["filename"],
                    description=attachment["description"],
                )
            )
        attachments = new_attachments

        data = await detect(
            message.content, path=os.path.join(os.getcwd(), "assets/lid.176.bin")
        )
        data["score"] = data["score"] * 100
        confidence = await self.bot.db_pool.fetchval(
            "SELECT auto_translate_confidence FROM guilds WHERE guild_id = $1",
            message.guild.id,
        )
        if confidence >= data["score"]:
            return
        reply_style = await self.bot.db_pool.fetchval(
            "SELECT auto_translate_reply_style FROM guilds WHERE guild_id = $1",
            message.guild.id,
        )
        delete_original = await self.bot.db_pool.fetchval(
            "SELECT auto_translate_delete_original FROM guilds WHERE guild_id = $1",
            message.guild.id,
        )
        guild_language = get_language(self.bot, message.guild.id)
        too_large_embed, too_large_file = error_embed(
            self.bot,
            i18n.t("errors.too_large_title", locale=guild_language),
            i18n.t("errors.too_large", locale=guild_language),
            message.guild.id,
            style="warning",
        )
        webhook_id = None
        for webhook in await message.channel.webhooks():
            if webhook.name == "AutoTranslate" and webhook.user.id is self.bot.user.id:
                webhook_id = webhook.id
        if not webhook_id:
            webhook = await message.channel.create_webhook(name="AutoTranslate")
        else:
            webhook = await self.bot.fetch_webhook(webhook_id)
        if data["lang"] != guild_language:
            translation = await translate(message.content, guild_language)
            if translation.lower() == message.content.lower():
                return
            try:
                match reply_style:
                    case "webhook":
                        await webhook.send(
                            username=f"{message.author.display_name} ({data['lang']} ??? {guild_language})",
                            avatar_url=message.author.display_avatar.url,
                            files=attachments,
                            embed=discord.Embed(
                                description=translation,
                                color=0x2F3136,
                            ).set_footer(text=f"Confidence: {round(data['score'])}%"),
                        )
                        if delete_original or delete_original is None:
                            await message.delete()
                            if attachment_removed:
                                await message.channel.send(
                                    message.author.mention,
                                    embed=too_large_embed,
                                    file=too_large_file,
                                    allowed_mentions=discord.AllowedMentions(
                                        everyone=False,
                                        users=[message.author],
                                        roles=False,
                                        replied_user=False,
                                    ),
                                )
                            return
                        if attachment_removed:
                            await message.reply(
                                embed=too_large_embed,
                                file=too_large_file,
                                mention_author=True,
                            )
                    case "min_webhook":
                        await webhook.send(
                            username=f"{message.author.display_name} ({data['lang']} ??? {guild_language})",
                            avatar_url=message.author.display_avatar.url,
                            files=attachments,
                            content=await translate(message.content, guild_language),
                        )
                        if delete_original:
                            await message.delete()
                            if attachment_removed:
                                await message.channel.send(
                                    message.author.mention,
                                    embed=too_large_embed,
                                    file=too_large_file,
                                    allowed_mentions=discord.AllowedMentions(
                                        everyone=False,
                                        users=[message.author],
                                        roles=False,
                                        replied_user=False,
                                    ),
                                )
                            return
                        if attachment_removed:
                            await message.reply(
                                embed=too_large_embed,
                                file=too_large_file,
                                mention_author=True,
                            )
                    case _:
                        if delete_original:
                            await message.channel.send(
                                f"{message.author.mention}:\n> "
                                + (translation).replace("\n", "\n> ")
                                + f"\n\n` {data['lang']} ??? {guild_language} | {round(data['score'])} `",
                                allowed_mentions=discord.AllowedMentions.none(),
                                files=attachments,
                            )
                            if attachment_removed:
                                await message.channel.send(
                                    message.author.mention,
                                    embed=too_large_embed,
                                    file=too_large_file,
                                    allowed_mentions=discord.AllowedMentions(
                                        everyone=False,
                                        users=[message.author],
                                        roles=False,
                                        replied_user=False,
                                    ),
                                )
                            await message.delete()
                            return
                        await message.reply(
                            "> "
                            + (translation).replace("\n", "\n> ")
                            + f"\n\n` {data['lang']} ??? {guild_language} | {round(data['score'])} `",
                            allowed_mentions=discord.AllowedMentions.none(),
                            mention_author=False,
                            files=attachments,
                        )
                        if attachment_removed:
                            await message.reply(
                                embed=too_large_embed,
                                file=too_large_file,
                                mention_author=True,
                            )
            except discord.Forbidden:
                return
