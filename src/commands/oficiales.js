const { SlashCommandBuilder } = require("@discordjs/builders");
const { CHANNEL_NAME } = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("oficiales")
    .setDescription("¡Habla con los Oficiales!")
    .addStringOption((option) =>
      option
        .setName("mensaje")
        .setDescription(
          "Mensaje que quieres enviar a los Oficiales. Nadie más podrá verlo.",
        )
        .setRequired(true),
    ),
  async execute(interaction) {
    const message = interaction.options.getString("mensaje");
    const sender = {
      id: interaction.user.id,
      tag: interaction.user.tag,
      nickname: interaction.member.nickname,
    };
    const channel = interaction.guild.channels.cache.find(
      (ch) => ch.name === CHANNEL_NAME,
    );

    await interaction.reply({
      content: `Gracias, <@${sender.id}>. Nuestra nutria mensajera ha enviado tu mensaje a los Oficiales :otter:.`,
      ephemeral: true,
    });

    await channel.send(
      `<@${sender.id}> envía: ${message}\ndesde el canal: <#${interaction.channelId}>`,
    );
  },
};
