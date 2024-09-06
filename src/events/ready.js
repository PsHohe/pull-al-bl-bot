const { ChannelType, PermissionsBitField } = require("discord.js");
const { CHANNEL_NAME, RAIDS_CHANNEL_NAME } = require("../config");

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    console.log(`El bot está funcionando.`);

    client.guilds.cache.forEach(async (guild) => {
      const guildChannel = guild.channels.cache.find(
        (ch) => ch.name === CHANNEL_NAME,
      );
      if (guildChannel) {
        if (
          !guildChannel.permissionsFor(client.user).has("ViewChannel") &&
          guild.members.me.permissions.has("ManageChannels") &&
          guild.members.me.permissions.has("ManageRoles")
        ) {
          console.log("Agregando permisos al canal: " + guildChannel.name);
          await guildChannel.permissionOverwrites.create(client.user, {
            ViewChannel: true,
            SendMessages: true,
          });
        }
      } else {
        console.log("Creando canal: " + CHANNEL_NAME);
        await guild.channels.create({
          name: CHANNEL_NAME,
          type: ChannelType.GuildText,
          permissionOverwrites: [
            {
              id: client.user.id,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
              ],
            },
          ],
        });
      }

      const raidsChannel = guild.channels.cache.find(
        (ch) => ch.name === RAIDS_CHANNEL_NAME,
      );
      if (!raidsChannel) {
        console.log("Creando canal: " + RAIDS_CHANNEL_NAME);
        await guild.channels.create({
          name: RAIDS_CHANNEL_NAME,
          type: ChannelType.GuildText,
        });
      }
    });

    await client.application.commands.set(
      Array.from(client.commands.values()).map((cmd) => cmd.data),
    );
  },
};
