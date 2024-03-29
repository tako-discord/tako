import i18n
import discord
import aiohttp
from main import TakoBot
from discord import app_commands
from discord.ext import commands
from typings.apis import SomeRandomApi
from discord.app_commands import Choice
from utils import error_embed, get_language, get_color


class Animals(commands.Cog):
    def __init__(self, bot: TakoBot):
        self.bot = bot

    @app_commands.command(description="Get a random animal image and fact")
    @app_commands.choices(
        animal=[
            Choice(name="Bird", value="bird"),
            Choice(name="Cat", value="cat"),
            Choice(name="Dog", value="dog"),
            Choice(name="Fox", value="fox"),
            Choice(name="Kangaroo", value="kangaroo"),
            Choice(name="Koala", value="koala"),
            Choice(name="Panda", value="panda"),
            Choice(name="Racoon", value="raccoon"),
            Choice(name="Red Panda", value="red_panda"),
        ]
    )
    @app_commands.describe(animal="The animal to get an image and fact about")
    async def animal(self, interaction: discord.Interaction, animal: str):
        url = "https://some-random-api.ml/animal/" + animal
        locale = get_language(self.bot, interaction.guild_id)

        # Initialize the session
        async with aiohttp.ClientSession() as session:
            # Make the request
            async with session.get(url) as response:
                # If not successful, return an error embed
                if not response.status == 200:
                    embed, file = error_embed(
                        self.bot,
                        i18n.t("error.api_error_title", locale=locale),
                        i18n.t(
                            "error.api_error",
                            locale=locale,
                            error=f"SRA ANIMAL: {response.status} {response.reason} ({url})",
                        ),
                        interaction.guild_id,
                    )
                    await interaction.response.send_message(embed=embed, file=file)
                    return

                # Convert the data to a dictionary
                data: SomeRandomApi.Animal = await response.json()
                # Response
                embed = discord.Embed(
                    title=f"{animal.title()}",
                    description=data["fact"],
                    color=await get_color(self.bot, interaction.guild_id),
                )
                embed.set_image(url=data["image"])
                await interaction.response.send_message(embed=embed)
